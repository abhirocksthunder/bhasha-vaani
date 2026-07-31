from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.language_registry import LanguageRegistry
from app.lesson_journey import recommend_lesson_journey
from app.provider_gateway import list_local_ollama_models
from app.storage import BhashaVaaniStore
from app.word_assistant import explain_word

app = FastAPI(title="BhashaVaani API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:6002",
        "http://localhost:6002",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
store = BhashaVaaniStore()
language_registry = LanguageRegistry()


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
    return recommend_lesson_journey(payload, store.progress_summary(profile_id))


@app.get("/profiles/{profile_id}/progress")
def progress(profile_id: str) -> dict[str, object]:
    return store.progress_summary(profile_id)
