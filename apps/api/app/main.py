import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.catalog_generator import CatalogGenerationError, approve_catalog_phrases, generate_candidate_phrases
from app.language_registry import LanguageRegistry
from app.lesson_generator import LessonGenerationError, generate_lesson_plan
from app.lesson_journey import recommend_lesson_journey
from app.provider_gateway import ProviderGatewayError, list_local_ollama_models
from app.storage import BhashaVaaniStore
from app.word_assistant import explain_word

app = FastAPI(title="BhashaVaani API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # 6002: apps/mobile_flutter (Flutter Web build, via Start BhashaVaani.cmd)
        "http://127.0.0.1:6002",
        "http://localhost:6002",
        # 6003: apps/web_pwa (Vite dev server / preview) -- new frontend,
        # running side-by-side with Flutter during the migration described
        # in .ai/handoffs/BV-WEBPWA-001.yaml
        "http://127.0.0.1:6003",
        "http://localhost:6003",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
store = BhashaVaaniStore()
language_registry = LanguageRegistry()
logger = logging.getLogger("bhashavaani.lesson_generation")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/languages")
def languages() -> list[dict[str, object]]:
    return language_registry.list_languages()


@app.get("/profiles")
def profiles() -> list[dict[str, object]]:
    return store.list_profiles()


@app.post("/profiles")
def create_profile(profile: dict[str, object]) -> dict[str, object]:
    return store.create_profile(profile)


@app.post("/learning-sessions")
def create_learning_session(payload: dict[str, object]) -> dict[str, object]:
    return store.create_learning_session(payload)


@app.post("/progress/events")
def record_progress_event(event: dict[str, object]) -> dict[str, object]:
    return store.record_progress_event(event)


@app.post("/assistant/word")
def assistant_word(payload: dict[str, object]) -> dict[str, object]:
    return explain_word(payload)


@app.get("/providers/ollama/models")
def ollama_models() -> dict[str, object]:
    return list_local_ollama_models()


@app.post("/lesson-journey")
def lesson_journey(payload: dict[str, object]) -> dict[str, object]:
    profile_id = str(payload.get("profile_id", "profile_abhilash"))
    language_code = str(payload.get("language_code", "kn"))
    return recommend_lesson_journey(
        payload,
        store.progress_summary(profile_id, language_code=language_code),
        store.get_active_lesson_plan(
            profile_id=profile_id,
            language_code=language_code,
        ),
    )


@app.post("/lesson-journey/generate")
def generate_journey(payload: dict[str, object]) -> dict[str, object]:
    profile_id = str(payload.get("profile_id", "profile_abhilash"))
    language_code = str(payload.get("language_code", "kn"))
    completed_pairs = store.get_completed_catalog_pairs(
        profile_id=profile_id,
        language_code=language_code,
    )
    try:
        plan = generate_lesson_plan(
            payload,
            store.progress_summary(profile_id, language_code=language_code),
            completed_pairs=completed_pairs,
        )
    except (LessonGenerationError, ProviderGatewayError) as error:
        # The Flutter UI only shows the top-level error string (already
        # embedded in `error`), but per-attempt diagnostics (raw model
        # output snippets, which attempt failed and why) are easy to lose
        # since they're only visible if the badge text isn't clipped.
        # Logging them server-side makes `uvicorn --reload` console output
        # the fastest way to see why local-model generation is failing,
        # without needing the frontend at all.
        diagnostics = getattr(error, "diagnostics", None)
        logger.warning(
            "Lesson generation rejected for profile=%s language=%s: %s%s",
            profile_id,
            language_code,
            error,
            f" | diagnostics: {diagnostics}" if diagnostics else "",
        )
        return {
            "accepted": False,
            "error": str(error),
        }
    saved_plan = store.save_lesson_plan(plan)
    return {
        "accepted": True,
        **saved_plan,
    }


@app.post("/catalog/{language_code}/generate-candidates")
def generate_catalog_candidates(language_code: str, payload: dict[str, object]) -> dict[str, object]:
    """Generates candidate starter-catalog phrases WITHOUT writing them
    anywhere. Nothing here touches the trusted on-disk catalog -- that only
    happens via /catalog/{language_code}/approve, after a human has reviewed
    what came back. See apps/api/app/catalog_generator.py for why that
    separation matters."""
    model = str(payload.get("model", "")).strip()
    count = int(payload.get("count", 8))
    count = max(1, min(count, 20))

    if not model:
        return {"accepted": False, "error": "An Ollama model must be selected to generate candidates."}

    try:
        result = generate_candidate_phrases(language_code=language_code, model=model, count=count)
    except CatalogGenerationError as error:
        diagnostics = getattr(error, "diagnostics", None)
        logger.warning(
            "Catalog candidate generation rejected for language=%s model=%s: %s%s",
            language_code,
            model,
            error,
            f" | diagnostics: {diagnostics}" if diagnostics else "",
        )
        return {"accepted": False, "error": str(error)}
    except ProviderGatewayError as error:
        return {"accepted": False, "error": str(error)}

    return {"accepted": True, **result}


@app.post("/catalog/{language_code}/approve")
def approve_catalog_candidates(language_code: str, payload: dict[str, object]) -> dict[str, object]:
    """Appends human-approved phrases (and only those -- the caller sends
    back exactly the candidates the reviewer checked, not "regenerate and
    trust it") to the on-disk starter catalog."""
    items = payload.get("items")
    if not isinstance(items, list) or not items:
        return {"accepted": False, "error": "No approved items were provided."}

    try:
        result = approve_catalog_phrases(
            language_code=language_code,
            approved_items=[item for item in items if isinstance(item, dict)],
        )
    except CatalogGenerationError as error:
        return {"accepted": False, "error": str(error)}

    return {"accepted": True, **result}


@app.get("/profiles/{profile_id}/progress")
def progress(profile_id: str, language_code: str | None = None) -> dict[str, object]:
    return store.progress_summary(profile_id, language_code=language_code)


@app.get("/profiles/{profile_id}/learned-words")
def learned_words(profile_id: str, language_code: str | None = None) -> dict[str, object]:
    words = store.get_learned_words(profile_id=profile_id, language_code=language_code)
    return {
        "profile_id": profile_id,
        "language_code": language_code,
        "count": len(words),
        "words": words,
    }
