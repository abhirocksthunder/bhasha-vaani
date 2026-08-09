"""Generate and persist starter-curriculum catalog phrases with a
human-in-the-loop approval step.

This is the shared implementation behind both `tools/generate_catalog_phrases.py`
(CLI, writes directly) and the `/catalog/*` endpoints in main.py (used by
apps/web_pwa's Catalog tab, where a person reviews and approves/rejects each
candidate before anything is written).

Why the approval step exists: BhashaVaani's lesson generator only ever
selects phrase/meaning pairs that already exist in the approved catalog --
it never lets a model's output reach a learner unreviewed (see
CLAUDE.md's "LLM outputs must be validated before persistence" rule). This
module can only validate candidate phrases *structurally* (non-empty
fields, no duplicates against the existing catalog); it cannot verify that
generated native-script text is linguistically correct. A human approving
each phrase before it's added to the trusted catalog is what closes that
gap -- this module does not, by itself, satisfy the validation rule; the
approval step in front of `approve_catalog_phrases` is what does.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.lesson_generator import _attempt_json_repair, _extract_json_object
from app.provider_gateway import ProviderGatewayError, generate_with_ollama

LANGUAGE_PACKS_PATH = Path(__file__).resolve().parents[3] / "language_packs"
MAX_GENERATION_ATTEMPTS = 3


class CatalogGenerationError(ValueError):
    def __init__(self, message: str, diagnostics: list[str] | None = None) -> None:
        super().__init__(message)
        self.diagnostics = diagnostics or []


def _curriculum_path(language_code: str) -> Path:
    return LANGUAGE_PACKS_PATH / language_code / "curriculum" / "starter.json"


def _manifest_path(language_code: str) -> Path:
    return LANGUAGE_PACKS_PATH / language_code / "manifest.yaml"


def _language_name(language_code: str) -> str:
    """Best-effort read of manifest.yaml's language.name, without depending
    on the repo-root tools/ package (which isn't reliably on sys.path when
    the backend runs as `python -m uvicorn app.main:app` from apps/api --
    tools/validate_language_packs.py's parse_simple_yaml is the "real"
    parser for this file elsewhere in the repo, this is a deliberately tiny
    duplicate of just the one field this module needs)."""
    manifest_path = _manifest_path(language_code)
    if not manifest_path.exists():
        return language_code
    try:
        in_language_block = False
        for line in manifest_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if stripped == "language:":
                in_language_block = True
                continue
            if in_language_block:
                if not line.startswith(" "):
                    break
                if stripped.startswith("name:"):
                    return stripped.split(":", 1)[1].strip().strip('"').strip("'") or language_code
        return language_code
    except Exception:
        return language_code


def load_catalog(language_code: str) -> dict[str, Any]:
    curriculum_path = _curriculum_path(language_code)
    if not curriculum_path.exists():
        raise CatalogGenerationError(f"No curriculum file found for language '{language_code}'.")
    return json.loads(curriculum_path.read_text(encoding="utf-8"))


def generate_candidate_phrases(
    *,
    language_code: str,
    model: str,
    count: int,
    provider_generate=generate_with_ollama,
) -> dict[str, Any]:
    """Generates candidate phrases WITHOUT writing anything to disk. Returns
    a dict with the candidates plus diagnostics, for a caller (CLI or API)
    to present to a human for approval."""
    catalog = load_catalog(language_code)
    existing_activities = catalog.get("activities", [])
    existing_pairs = {
        (str(item.get("phrase", "")).strip().lower(), str(item.get("meaning", "")).strip().lower())
        for item in existing_activities
    }
    language_name = _language_name(language_code)

    prompt = _build_prompt(language_name, language_code, count, existing_activities)
    diagnostics: list[str] = []
    current_prompt = prompt

    for attempt in range(1, MAX_GENERATION_ATTEMPTS + 1):
        try:
            output = provider_generate(
                prompt=current_prompt,
                route=f"ollama:{model}",
                json_mode=True,
                temperature=0.4,
                num_predict=max(400, count * 90),
            )
        except ProviderGatewayError as error:
            diagnostics.append(f"attempt {attempt}: provider error: {error}")
            current_prompt = prompt
            continue

        raw_answer = str(output.get("answer", ""))
        json_text: str | None = None
        try:
            json_text = _extract_json_object(raw_answer)
            payload = json.loads(json_text)
        except (ValueError, json.JSONDecodeError) as error:
            repaired = _attempt_json_repair(json_text) if json_text is not None else None
            if repaired is None:
                diagnostics.append(f"attempt {attempt}: invalid JSON: {error}")
                current_prompt = (
                    f"{prompt}\n\nYour previous reply was rejected for invalid JSON. "
                    "Reply again with ONLY the corrected JSON object, no commentary, no markdown fences."
                )
                continue
            payload = repaired

        activities = payload.get("activities")
        if not isinstance(activities, list) or not activities:
            diagnostics.append(f"attempt {attempt}: JSON had no activities list")
            current_prompt = prompt
            continue

        candidates = _validate_candidates(activities, existing_pairs=existing_pairs)
        diagnostics.append(f"attempt {attempt}: {len(activities)} raw, {len(candidates)} valid after checks")
        return {
            "language_code": language_code,
            "language_name": language_name,
            "model": model,
            "candidates": candidates,
            "diagnostics": diagnostics,
        }

    raise CatalogGenerationError(
        f"Model failed to produce usable candidates after {MAX_GENERATION_ATTEMPTS} attempts.",
        diagnostics=diagnostics,
    )


def approve_catalog_phrases(
    *,
    language_code: str,
    approved_items: list[dict[str, str]],
) -> dict[str, Any]:
    """Appends human-approved candidates to the on-disk catalog. Re-validates
    against the CURRENT on-disk catalog (not a stale snapshot from
    generation time) so a slow reviewer doesn't accidentally introduce a
    duplicate that was added by someone/something else in the meantime."""
    curriculum_path = _curriculum_path(language_code)
    catalog = load_catalog(language_code)
    existing_activities = catalog.get("activities", [])
    existing_pairs = {
        (str(item.get("phrase", "")).strip().lower(), str(item.get("meaning", "")).strip().lower())
        for item in existing_activities
    }

    validated = _validate_candidates(approved_items, existing_pairs=existing_pairs)
    if not validated:
        return {"added": 0, "total": len(existing_activities), "skipped": len(approved_items)}

    next_index = len(existing_activities) + 1
    for item in validated:
        item["id"] = f"{language_code}_a1_starter_{next_index:02d}"
        next_index += 1

    catalog["activities"] = existing_activities + validated
    curriculum_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return {
        "added": len(validated),
        "total": len(catalog["activities"]),
        "skipped": len(approved_items) - len(validated),
    }


def _build_prompt(
    language_name: str,
    language_code: str,
    count: int,
    existing_activities: list[dict[str, Any]],
) -> str:
    existing_phrases_text = json.dumps(
        [{"phrase": item.get("phrase", ""), "meaning": item.get("meaning", "")} for item in existing_activities],
        ensure_ascii=False,
    )
    return (
        f"You are helping build a beginner {language_name} ({language_code}) phrasebook for a "
        "family language-learning app. "
        f"Generate exactly {count} NEW beginner-friendly phrases that are DIFFERENT from the phrases "
        f"already in the catalog below. Do not repeat or lightly reword any of them: {existing_phrases_text}. "
        "Return JSON only in this exact shape, with no extra keys and no explanation text: "
        '{"activities":[{"title":"...","prompt":"...","phrase":"...","native_script":"...","meaning":"..."}]}. '
        "For each activity: 'title' is a short 1-3 word label, 'prompt' is one sentence telling the learner "
        "what to practise, 'phrase' is the ROMANIZED (Latin-script) transliteration, 'native_script' is the "
        f"same phrase written correctly in {language_name}'s native script, and 'meaning' is the English "
        "translation. Every field must be non-empty. Keep phrases short, practical, everyday, and family-safe."
    )


def _validate_candidates(
    items: list[Any],
    *,
    existing_pairs: set[tuple[str, str]],
) -> list[dict[str, str]]:
    seen_pairs = set(existing_pairs)
    validated: list[dict[str, str]] = []

    for item in items:
        if not isinstance(item, dict):
            continue
        normalized = {
            field: str(item.get(field, "")).strip()
            for field in ("title", "prompt", "phrase", "native_script", "meaning")
        }
        if not all(normalized.values()):
            continue
        pair_key = (normalized["phrase"].lower(), normalized["meaning"].lower())
        if pair_key in seen_pairs:
            continue
        seen_pairs.add(pair_key)
        validated.append(normalized)

    return validated
