from __future__ import annotations

import json
import re
from collections.abc import Callable
from typing import Any

from app.provider_gateway import ProviderGatewayError, generate_with_ollama
from app.lesson_catalog import get_starter_activities
from app.lesson_request import parse_lesson_request


ProviderGenerate = Callable[..., dict[str, Any]]

# Stage 1.1 (docs/product/roadmap-learning-features.md): local models were
# observed returning malformed or truncated JSON for lesson generation. The
# two biggest causes found during investigation were (1) a fixed 350-token
# response budget that truncates mid-JSON once a plan has more than a
# handful of activities, and (2) no second chance when a single generation
# attempt comes back invalid. Both are addressed below with a sized token
# budget and a bounded repair-retry loop that feeds the exact parse error
# back to the model.
MAX_GENERATION_ATTEMPTS = 3
TOKENS_PER_ACTIVITY = 110
BASE_TOKEN_BUDGET = 180
MAX_TOKEN_BUDGET = 1400


class LessonGenerationError(ValueError):
    """Raised when a lesson plan cannot be safely generated or persisted.

    ``diagnostics`` carries attempt-by-attempt failure detail (never shown to
    end users) so backend logs can tell which model/attempt combination is
    unreliable, per the "better diagnostics for Ollama failures" roadmap item.
    """

    def __init__(self, message: str, diagnostics: list[str] | None = None) -> None:
        super().__init__(message)
        self.diagnostics = diagnostics or []


def generate_lesson_plan(
    payload: dict[str, Any],
    progress_summary: dict[str, Any],
    provider_generate: ProviderGenerate = generate_with_ollama,
    completed_pairs: set[tuple[str, str]] | None = None,
) -> dict[str, Any]:
    language_code = str(payload.get("language_code", "kn")).strip() or "kn"
    profile_id = str(payload.get("profile_id", "profile_abhilash")).strip()
    profile = payload.get("profile", {}) if isinstance(payload.get("profile"), dict) else {}
    explanation_language = str(
        payload.get("explanation_language")
        or profile.get("explanation_language")
        or "English",
    )
    tutor_route = str(payload.get("tutor_model", payload.get("model", "local_ollama")))
    reviewer_route = str(payload.get("reviewer_model", tutor_route))

    # Stage 1.3 (docs/product/roadmap-learning-features.md): a free-form
    # "teach me X" request (e.g. "5 new words today", "review what we did")
    # can size and scope the plan without the caller picking lesson numbers
    # manually. Explicit payload fields always win over the parsed hint --
    # this is a fallback for callers that only send request_text, not a
    # way to override an explicit target_count/mode.
    request_text = str(payload.get("request_text", "")).strip()
    request_hints = parse_lesson_request(request_text) if request_text else {}

    if "target_count" in payload:
        target_count = int(payload["target_count"])
    elif "target_count" in request_hints:
        target_count = int(request_hints["target_count"])
    else:
        target_count = 8
    target_count = max(4, min(target_count, 12))

    mode = str(payload.get("mode") or request_hints.get("mode") or "balanced")

    catalog_items = get_starter_activities(language_code)
    token_budget = _token_budget_for(target_count)

    tutor_prompt = _build_tutor_prompt(
        language_code=language_code,
        explanation_language=explanation_language,
        progress_summary=progress_summary,
        target_count=target_count,
        catalog_items=catalog_items,
        completed_pairs=completed_pairs or set(),
        mode=mode,
    )
    draft_items, tutor_model, tutor_diagnostics = _generate_items_with_retry(
        provider_generate=provider_generate,
        route=tutor_route,
        base_prompt=tutor_prompt,
        token_budget=token_budget,
        label="tutor",
    )

    reviewer_prompt = _build_reviewer_prompt(
        language_code=language_code,
        explanation_language=explanation_language,
        items=draft_items,
        catalog_items=catalog_items,
    )
    reviewed_items, reviewer_model, reviewer_diagnostics = _generate_items_with_retry(
        provider_generate=provider_generate,
        route=reviewer_route,
        base_prompt=reviewer_prompt,
        token_budget=token_budget,
        label="reviewer",
    )
    try:
        validated_items = _validate_items(
            reviewed_items,
            target_count=target_count,
            catalog_items=catalog_items,
        )
    except LessonGenerationError as error:
        raise LessonGenerationError(
            f"Reviewer output failed schema validation; lesson was not saved. Detail: {error}",
            diagnostics=[*tutor_diagnostics, *reviewer_diagnostics, str(error)],
        ) from error

    if mode != "review":
        # Topping up with not-yet-learned items would defeat an explicit
        # review request, so only apply the coverage guarantee for the
        # default/"new" cases.
        validated_items = _ensure_new_phrase_coverage(
            validated_items,
            catalog_items=catalog_items,
            completed_pairs=completed_pairs or set(),
            target_count=target_count,
        )

    plan_id = f"plan_{profile_id}_{language_code}_{int(progress_summary.get('event_count', 0)) + 1}"
    return {
        "plan_id": plan_id,
        "profile_id": profile_id,
        "language_code": language_code,
        "source": "local_two_model_generation",
        "tutor_model": tutor_model,
        "reviewer_model": reviewer_model,
        "reviewer_notes": "Reviewer output passed backend schema validation.",
        "generation_diagnostics": [*tutor_diagnostics, *reviewer_diagnostics],
        "request_interpretation": (
            {
                "request_text": request_text,
                "resolved_mode": mode,
                "resolved_target_count": target_count,
            }
            if request_text
            else None
        ),
        "activities": [
            {
                **item,
                "id": f"{plan_id}_activity_{index + 1:02d}",
                "state": "next" if index == 0 else "upcoming",
            }
            for index, item in enumerate(validated_items)
        ],
    }


def _generate_items_with_retry(
    *,
    provider_generate: ProviderGenerate,
    route: str,
    base_prompt: str,
    token_budget: int,
    label: str,
) -> tuple[list[dict[str, str]], str, list[str]]:
    """Call a model up to MAX_GENERATION_ATTEMPTS times, feeding back the
    exact parse/validation error on each retry so the model can repair its
    own output, instead of failing the whole plan on the first bad reply."""
    diagnostics: list[str] = []
    last_error: Exception | None = None
    prompt = base_prompt

    for attempt in range(1, MAX_GENERATION_ATTEMPTS + 1):
        temperature = 0.2 if attempt == 1 else 0.1
        attempt_budget = min(MAX_TOKEN_BUDGET, token_budget + (attempt - 1) * 200)
        try:
            output = provider_generate(
                prompt=prompt,
                route=route,
                json_mode=True,
                temperature=temperature,
                num_predict=attempt_budget,
            )
        except ProviderGatewayError as error:
            last_error = error
            diagnostics.append(f"{label} attempt {attempt}: provider error: {error}")
            prompt = base_prompt
            continue

        raw_answer = str(output.get("answer", ""))
        try:
            items = _extract_items(raw_answer)
        except LessonGenerationError as error:
            last_error = error
            diagnostics.append(
                f"{label} attempt {attempt}: {error} (raw output: {_snippet(raw_answer)})",
            )
            prompt = _build_repair_prompt(base_prompt, str(error), raw_answer)
            continue

        model_name = str(output.get("model", route))
        diagnostics.append(f"{label} attempt {attempt}: succeeded with {len(items)} raw items")
        return items, model_name, diagnostics

    diagnostics_text = "; ".join(diagnostics) if diagnostics else "no attempts recorded"
    raise LessonGenerationError(
        f"{label.capitalize()} model failed after {MAX_GENERATION_ATTEMPTS} attempts. "
        f"Lesson was not saved. Last error: {last_error}. Diagnostics: {diagnostics_text}",
        diagnostics=diagnostics,
    )


def _token_budget_for(target_count: int) -> int:
    return min(MAX_TOKEN_BUDGET, BASE_TOKEN_BUDGET + target_count * TOKENS_PER_ACTIVITY)


def _snippet(text: str, limit: int = 160) -> str:
    cleaned = " ".join(text.split())
    if len(cleaned) <= limit:
        return cleaned
    return f"{cleaned[:limit]}...(truncated, {len(cleaned)} chars total)"


def _build_repair_prompt(base_prompt: str, error_detail: str, previous_answer: str) -> str:
    return (
        f"{base_prompt}\n\n"
        "Your previous reply was rejected by the backend and was NOT saved. "
        f"Rejection reason: {error_detail}. "
        f"Your previous reply started with: {_snippet(previous_answer, 200)}. "
        "Reply again with ONLY the corrected JSON object, no commentary, no markdown fences, "
        "and make sure every field is present and non-empty for every activity."
    )


def _build_tutor_prompt(
    *,
    language_code: str,
    explanation_language: str,
    progress_summary: dict[str, Any],
    target_count: int,
    catalog_items: list[dict[str, str]],
    completed_pairs: set[tuple[str, str]],
    mode: str = "balanced",
) -> str:
    # Split the catalog into what the learner hasn't seen yet vs. what
    # they've already completed, so regenerating a plan prefers new
    # material instead of reproducing an overlapping set from the same
    # small starter catalog (Stage 1.2 in docs/product/roadmap-learning-
    # features.md). This is a best-effort instruction, not a hard filter:
    # the backend's catalog-membership validation still applies either way.
    new_items = [
        item
        for item in catalog_items
        if (item["phrase"], item["meaning"]) not in completed_pairs
    ]
    review_items = [
        item
        for item in catalog_items
        if (item["phrase"], item["meaning"]) in completed_pairs
    ]

    catalog_text = json.dumps(
        [{"phrase": item["phrase"], "meaning": item["meaning"]} for item in catalog_items],
        ensure_ascii=False,
    )

    if mode == "review" and review_items:
        # Stage 1.3: an explicit "teach me X" request like "review what we
        # did" should draw only from already-completed phrases, not the
        # usual "prefer new" default.
        review_text = json.dumps(
            [{"phrase": item["phrase"], "meaning": item["meaning"]} for item in review_items],
            ensure_ascii=False,
        )
        coverage_instruction = (
            "The learner explicitly asked for a review session. Use ONLY these "
            f"already-completed phrases, in a different order than before: {review_text}."
        )
    elif new_items:
        new_text = json.dumps(
            [{"phrase": item["phrase"], "meaning": item["meaning"]} for item in new_items],
            ensure_ascii=False,
        )
        coverage_instruction = (
            f"The learner has already completed {len(review_items)} of {len(catalog_items)} "
            f"catalog phrases. Prefer these not-yet-learned phrases first: {new_text}. "
            "Only include an already-completed phrase as light review if there are not "
            "enough not-yet-learned phrases to reach the requested count."
        )
    else:
        coverage_instruction = (
            "The learner has already completed every phrase in the catalog at least once. "
            "Build this plan as spaced review, mixing phrases rather than presenting them "
            "in the same order as before."
        )

    return (
        "You are the BhashaVaani tutor model. "
        f"Create exactly {target_count} beginner lesson activities for language code {language_code}. "
        f"The learner explanation language is {explanation_language}. "
        f"Completed activity count: {progress_summary.get('completed_activities', 0)}. "
        "Use only phrase and meaning values from this approved catalog; do not invent translations: "
        f"{catalog_text}. "
        f"{coverage_instruction} "
        "Return JSON only in this exact shape, with no extra keys and no explanation text: "
        "{\"activities\":[{\"title\":\"...\",\"prompt\":\"...\",\"phrase\":\"...\",\"meaning\":\"...\"}]}. "
        "Every activity must have all four fields non-empty. "
        "Use romanized phrases when the learner may not read the target script. "
        "Keep each field short (under 12 words), practical, and family safe."
    )


def _build_reviewer_prompt(
    *,
    language_code: str,
    explanation_language: str,
    items: list[dict[str, str]],
    catalog_items: list[dict[str, str]],
) -> str:
    catalog_text = json.dumps(
        [
            {"phrase": item["phrase"], "meaning": item["meaning"]}
            for item in catalog_items
        ],
        ensure_ascii=False,
    )
    return (
        "You are the BhashaVaani reviewer model. "
        "Review and repair this lesson draft for correctness, beginner readability, safe content, "
        "and short mobile-friendly text. "
        f"Language code: {language_code}. Explanation language: {explanation_language}. "
        "Use only phrase and meaning values from this approved catalog; reject invented translations by replacing them with catalog items: "
        f"{catalog_text}. "
        "Return JSON only with the same shape, with no extra keys and no explanation text: "
        "{\"activities\":[{\"title\":\"...\",\"prompt\":\"...\",\"phrase\":\"...\",\"meaning\":\"...\"}]}. "
        "Every activity must have all four fields non-empty. "
        f"Draft JSON: {json.dumps({'activities': items}, ensure_ascii=False)}"
    )


def _extract_items(model_text: str) -> list[dict[str, str]]:
    json_text = _extract_json_object(model_text)
    try:
        payload = json.loads(json_text)
    except json.JSONDecodeError as error:
        repaired = _attempt_json_repair(json_text)
        if repaired is None:
            raise LessonGenerationError(f"Model did not return valid JSON: {error}") from error
        payload = repaired

    activities = payload.get("activities")
    if not isinstance(activities, list) or not activities:
        raise LessonGenerationError("Model JSON is missing a non-empty activities list.")
    return activities


def _attempt_json_repair(json_text: str) -> dict[str, Any] | None:
    """Best-effort repair for the most common local-model JSON mistakes:
    trailing commas before a closing bracket/brace, and a truncated reply
    that is missing its final closing brackets."""
    candidate = re.sub(r",\s*([}\]])", r"\1", json_text)
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    # Truncated mid-array: close off the last complete activity object and
    # the surrounding array/object so a partial-but-valid plan can still be
    # salvaged from an early attempt (still subject to the >=4 item and
    # catalog checks in _validate_items before anything is persisted).
    last_complete = candidate.rfind("},")
    if last_complete == -1:
        return None
    truncated = candidate[: last_complete + 1] + "]}"
    truncated = re.sub(r",\s*([}\]])", r"\1", truncated)
    try:
        return json.loads(truncated)
    except json.JSONDecodeError:
        return None


def _extract_json_object(text: str) -> str:
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        return fenced.group(1)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise LessonGenerationError("No JSON object found in model output.")
    return text[start : end + 1]


def _ensure_new_phrase_coverage(
    validated_items: list[dict[str, str]],
    *,
    catalog_items: list[dict[str, str]],
    completed_pairs: set[tuple[str, str]],
    target_count: int,
) -> list[dict[str, str]]:
    """The tutor/reviewer prompts only give a soft "prefer not-yet-learned
    phrases" hint (see _build_tutor_prompt); a small local model can still
    keep re-selecting the same familiar catalog items, especially once the
    catalog has grown via the Catalog tab and the newly approved phrases sit
    at the end of a long list (BV-REPEAT-CATALOG-001). This deterministically
    tops up the plan with not-yet-completed catalog items the model didn't
    pick, so a bigger catalog actually shows up in generated plans instead of
    depending on model luck. Everything injected here still comes from the
    trusted on-disk catalog -- nothing model-invented is added.
    """
    if not catalog_items:
        return validated_items

    new_pool = [
        item
        for item in catalog_items
        if (item["phrase"], item["meaning"]) not in completed_pairs
    ]
    if not new_pool:
        return validated_items

    selected_pairs = {(item["phrase"], item["meaning"]) for item in validated_items}
    minimum_new = min(len(new_pool), max(1, target_count // 2))
    new_in_plan = sum(1 for pair in selected_pairs if pair in {(n["phrase"], n["meaning"]) for n in new_pool})

    if new_in_plan >= minimum_new:
        return validated_items

    topped_up = list(validated_items)
    for candidate in new_pool:
        if new_in_plan >= minimum_new:
            break
        pair = (candidate["phrase"], candidate["meaning"])
        if pair in selected_pairs:
            continue

        replacement = {
            "title": candidate["title"],
            "prompt": candidate["prompt"],
            "phrase": candidate["phrase"],
            "meaning": candidate["meaning"],
            "native_script": candidate.get("native_script", candidate["phrase"]),
        }

        if len(topped_up) < target_count:
            topped_up.append(replacement)
        else:
            # Make room by replacing an already-completed (review) item,
            # scanning from the end so freshly-picked new items stay put.
            replaced = False
            for index in range(len(topped_up) - 1, -1, -1):
                existing_pair = (topped_up[index]["phrase"], topped_up[index]["meaning"])
                if existing_pair in completed_pairs:
                    topped_up[index] = replacement
                    replaced = True
                    break
            if not replaced:
                break

        selected_pairs.add(pair)
        new_in_plan += 1

    return topped_up[:target_count]


def _validate_items(
    items: list[Any],
    *,
    target_count: int,
    catalog_items: list[dict[str, str]] | None = None,
) -> list[dict[str, str]]:
    allowed_pairs = {
        (item["phrase"], item["meaning"])
        for item in catalog_items or []
    }
    # Native script (e.g. ನಮಸ್ಕಾರ, नमस्ते) always comes from the trusted
    # catalog, never from the model. The model is not asked to produce it,
    # so this keeps pronunciation/rendering correct regardless of model
    # reliability, the same way phrase/meaning are constrained to the
    # catalog above.
    native_script_by_pair = {
        (item["phrase"], item["meaning"]): item.get("native_script", item["phrase"])
        for item in catalog_items or []
    }
    validated: list[dict[str, str]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        normalized = {
            field: str(item.get(field, "")).strip()
            for field in ("title", "prompt", "phrase", "meaning")
        }
        if allowed_pairs and (normalized["phrase"], normalized["meaning"]) not in allowed_pairs:
            continue
        if all(normalized.values()):
            pair = (normalized["phrase"], normalized["meaning"])
            normalized["native_script"] = native_script_by_pair.get(pair, normalized["phrase"])
            validated.append(normalized)

    if len(validated) < 4:
        raise LessonGenerationError(
            f"Reviewer output had only {len(validated)} valid activities after catalog "
            "and completeness checks; at least 4 are required.",
        )
    return validated[:target_count]
