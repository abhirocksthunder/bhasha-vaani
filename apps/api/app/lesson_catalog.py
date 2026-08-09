from __future__ import annotations

import json
from pathlib import Path
from typing import Any


LANGUAGE_PACKS_PATH = Path(__file__).resolve().parents[3] / "language_packs"


def list_catalog_language_codes() -> list[str]:
    """Language codes that have a starter curriculum on disk. Used to
    resolve historic progress events back to a phrase/meaning without
    hardcoding the language list."""
    if not LANGUAGE_PACKS_PATH.exists():
        return []
    return sorted(
        entry.name
        for entry in LANGUAGE_PACKS_PATH.iterdir()
        if entry.is_dir() and (entry / "curriculum" / "starter.json").exists()
    )


def get_starter_activities(language_code: str) -> list[dict[str, str]]:
    curriculum_path = LANGUAGE_PACKS_PATH / language_code / "curriculum" / "starter.json"
    if not curriculum_path.exists():
        return []

    payload = json.loads(curriculum_path.read_text(encoding="utf-8"))
    activities = payload.get("activities", [])
    return [
        {
            "id": str(activity["id"]),
            "title": str(activity["title"]),
            "prompt": str(activity["prompt"]),
            "phrase": str(activity["phrase"]),
            # Native-script text (e.g. ನಮಸ್ಕಾರ for Kannada, नमस्ते for Hindi).
            # Optional: catalogs that have not been backfilled yet fall back
            # to the romanized phrase so callers always get a usable value
            # to speak, even if it is not native-script.
            "native_script": str(activity.get("native_script") or activity["phrase"]),
            "meaning": str(activity["meaning"]),
        }
        for activity in activities
        if isinstance(activity, dict)
    ]
