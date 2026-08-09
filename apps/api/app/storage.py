from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Any

from app.language_registry import LanguageRegistry
from app.lesson_catalog import get_starter_activities, list_catalog_language_codes
from app.progress_event import ProgressEventEnvelope, ProgressEventValidationError


DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "bhasha_vaani.db"

SEED_PROFILES: list[dict[str, Any]] = [
    {
        "id": "profile_abhilash",
        "display_name": "Abhilash",
        "type": "adult",
        "age_group": "adult",
        "explanation_language": "Telugu",
        "session_minutes": 15,
    },
    {
        "id": "profile_child",
        "display_name": "Child profile",
        "type": "child",
        "age_group": "4 to 6",
        "explanation_language": "Telugu",
        "session_minutes": 5,
    },
]

def seed_languages() -> list[dict[str, Any]]:
    return LanguageRegistry().list_languages()


class BhashaVaaniStore:
    def __init__(self, db_path: Path | None = None) -> None:
        self.db_path = db_path or DEFAULT_DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    def initialize(self) -> None:
        with closing(self._connect()) as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS profiles (
                    id TEXT PRIMARY KEY,
                    display_name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    age_group TEXT NOT NULL,
                    explanation_language TEXT NOT NULL,
                    session_minutes INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS languages (
                    code TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    native_name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    transliteration INTEGER NOT NULL,
                    speech_to_text INTEGER NOT NULL,
                    text_to_speech INTEGER NOT NULL,
                    pronunciation TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS learning_sessions (
                    session_id TEXT PRIMARY KEY,
                    profile_id TEXT NOT NULL,
                    language_code TEXT NOT NULL,
                    current_activity_id TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS progress_events (
                    event_id TEXT PRIMARY KEY,
                    profile_id TEXT NOT NULL,
                    device_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    entity_id TEXT NOT NULL,
                    occurred_at TEXT NOT NULL,
                    recorded_at TEXT NOT NULL,
                    client_sequence INTEGER NOT NULL,
                    payload_json TEXT NOT NULL,
                    schema_version INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS lesson_plans (
                    plan_id TEXT PRIMARY KEY,
                    profile_id TEXT NOT NULL,
                    language_code TEXT NOT NULL,
                    source TEXT NOT NULL,
                    tutor_model TEXT NOT NULL,
                    reviewer_model TEXT NOT NULL,
                    reviewer_notes TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    active INTEGER NOT NULL DEFAULT 1
                );

                CREATE TABLE IF NOT EXISTS lesson_items (
                    plan_id TEXT NOT NULL,
                    item_index INTEGER NOT NULL,
                    activity_id TEXT NOT NULL PRIMARY KEY,
                    title TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    phrase TEXT NOT NULL,
                    meaning TEXT NOT NULL,
                    FOREIGN KEY(plan_id) REFERENCES lesson_plans(plan_id)
                );
                """
            )
            self._add_native_script_column_if_missing(connection)
            self._seed_profiles(connection)
            self._seed_languages(connection)
            connection.commit()

    def _add_native_script_column_if_missing(self, connection: sqlite3.Connection) -> None:
        # native_script was added after lesson_items already shipped, so
        # existing databases need an ALTER TABLE rather than a fresh
        # CREATE TABLE IF NOT EXISTS. Without this, generated plans lose
        # their native-script text the moment they are reloaded from
        # storage (e.g. after Generate plan triggers a progress refresh),
        # silently regressing text-to-speech back to reading the romanized
        # phrase with whatever fallback voice the browser picks.
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(lesson_items)").fetchall()
        }
        if "native_script" not in columns:
            connection.execute("ALTER TABLE lesson_items ADD COLUMN native_script TEXT")

    def list_profiles(self) -> list[dict[str, Any]]:
        with closing(self._connect()) as connection:
            rows = connection.execute(
                """
                SELECT id, display_name, type, age_group, explanation_language,
                       session_minutes
                FROM profiles
                ORDER BY type, display_name
                """
            ).fetchall()
        return [dict(row) for row in rows]

    def create_profile(self, profile: dict[str, Any]) -> dict[str, Any]:
        with closing(self._connect()) as connection:
            connection.execute(
                """
                INSERT INTO profiles (
                    id, display_name, type, age_group, explanation_language,
                    session_minutes
                )
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    display_name = excluded.display_name,
                    type = excluded.type,
                    age_group = excluded.age_group,
                    explanation_language = excluded.explanation_language,
                    session_minutes = excluded.session_minutes
                """,
                (
                    profile["id"],
                    profile["display_name"],
                    profile.get("type", "adult"),
                    profile.get("age_group", "adult"),
                    profile.get("explanation_language", "English"),
                    int(profile.get("session_minutes", 10)),
                ),
            )
            connection.commit()
        return profile

    def create_learning_session(self, payload: dict[str, Any]) -> dict[str, Any]:
        profile_id = payload.get("profile_id", "profile_abhilash")
        language_code = payload.get("language_code", "kn")
        session_id = payload.get(
            "session_id",
            f"session_{profile_id}_{language_code}_starter",
        )
        current_activity_id = payload.get(
            "current_activity_id",
            "kn_a1_lesson_01_activity_01",
        )

        with closing(self._connect()) as connection:
            connection.execute(
                """
                INSERT INTO learning_sessions (
                    session_id, profile_id, language_code, current_activity_id
                )
                VALUES (?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    current_activity_id = excluded.current_activity_id,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (session_id, profile_id, language_code, current_activity_id),
            )
            connection.commit()

        return {
            "session_id": session_id,
            "profile_id": profile_id,
            "language_code": language_code,
            "current_activity_id": current_activity_id,
        }

    def record_progress_event(
        self,
        event: ProgressEventEnvelope | dict[str, Any],
    ) -> dict[str, Any]:
        envelope = (
            event
            if isinstance(event, ProgressEventEnvelope)
            else ProgressEventEnvelope.from_dict(event)
        )

        with closing(self._connect()) as connection:
            duplicate = connection.execute(
                "SELECT 1 FROM progress_events WHERE event_id = ?",
                (envelope.event_id,),
            ).fetchone()

            if duplicate is None:
                connection.execute(
                    """
                    INSERT INTO progress_events (
                        event_id, profile_id, device_id, session_id, event_type,
                        entity_id, occurred_at, recorded_at, client_sequence,
                        payload_json, schema_version
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        envelope.event_id,
                        envelope.profile_id,
                        envelope.device_id,
                        envelope.session_id,
                        envelope.event_type,
                        envelope.entity_id,
                        envelope.occurred_at,
                        envelope.recorded_at,
                        envelope.client_sequence,
                        json.dumps(envelope.payload),
                        envelope.schema_version,
                    ),
                )
                connection.commit()

            server_checkpoint = connection.execute(
                "SELECT COUNT(*) AS count FROM progress_events",
            ).fetchone()["count"]

        return {
            "accepted": True,
            "duplicate": duplicate is not None,
            "server_checkpoint": server_checkpoint,
        }

    def progress_summary(self, profile_id: str, *, language_code: str | None = None) -> dict[str, Any]:
        """`completed_activities` used to be a raw `COUNT(DISTINCT entity_id)`
        across every language for this profile. That double-counted the same
        catalog phrase once per regenerated plan (a regenerated plan mints a
        new activity_id for the same phrase every time) and mixed every
        language's completions into one number -- which corrupted the
        starter-catalog fallback in `lesson_journey.recommend_lesson_journey`
        (a Kannada-only learner's `next_index`/`state` calc was being driven
        by a count that included Hindi completions too, and could exceed the
        Kannada catalog's own size, marking everything "completed" with
        nothing left to show). Reuses `get_learned_words`'s
        (language, phrase, meaning) dedup instead, so the count matches what
        the Progress tab's "Learned words" list actually shows. Pass
        `language_code` to scope to one language (what the lesson-journey
        endpoints should always do); omit it only for a legacy/global,
        still-deduped total across all languages.
        """
        completed_activities = len(
            self.get_learned_words(profile_id=profile_id, language_code=language_code),
        )

        with closing(self._connect()) as connection:
            event_count = connection.execute(
                "SELECT COUNT(*) AS event_count FROM progress_events WHERE profile_id = ?",
                (profile_id,),
            ).fetchone()["event_count"]

        return {
            "profile_id": profile_id,
            "completed_activities": completed_activities,
            "pending_reviews": 6,
            "current_lesson": "Starter lesson 1",
            "sync_state": "SQLite projection",
            "event_count": event_count,
        }

    def get_learned_words(
        self,
        *,
        profile_id: str,
        language_code: str | None = None,
    ) -> list[dict[str, Any]]:
        """History of completed/learnt words for a profile, newest first.

        Resolves each `activity_completed` progress event's entity_id back to
        a phrase/meaning/native_script two ways, since activity ids come
        from two different sources: generated plans (looked up via
        lesson_items + lesson_plans) and language-pack starter catalogs
        (looked up by id against each catalog on disk). Events that cannot
        be resolved to either are skipped rather than shown with blank text.

        Grouped by (language, phrase, meaning) rather than by raw entity_id:
        the same catalog phrase gets a *different* activity_id every time it
        appears in a freshly generated plan, so grouping by entity_id alone
        showed the same phrase as separate "duplicate" history rows once a
        learner had done a few review sessions. Each returned word instead
        carries a `times_completed` count and the most recent completion
        time, since event_rows is already ordered newest-first.
        """
        with closing(self._connect()) as connection:
            event_rows = connection.execute(
                """
                SELECT entity_id, occurred_at, recorded_at
                FROM progress_events
                WHERE profile_id = ? AND event_type = 'activity_completed'
                ORDER BY occurred_at DESC, recorded_at DESC
                """,
                (profile_id,),
            ).fetchall()

            item_rows = connection.execute(
                """
                SELECT li.activity_id, li.title, li.phrase, li.meaning,
                       li.native_script, lp.language_code
                FROM lesson_items li
                JOIN lesson_plans lp ON lp.plan_id = li.plan_id
                """,
            ).fetchall()

        generated_lookup = {row["activity_id"]: dict(row) for row in item_rows}

        catalog_lookup: dict[str, dict[str, Any]] = {}
        for code in list_catalog_language_codes():
            for item in get_starter_activities(code):
                catalog_lookup[item["id"]] = {**item, "language_code": code}

        grouped: dict[tuple[str, str, str], dict[str, Any]] = {}
        order: list[tuple[str, str, str]] = []
        for row in event_rows:
            entity_id = row["entity_id"]
            resolved = generated_lookup.get(entity_id) or catalog_lookup.get(entity_id)
            if resolved is None:
                continue

            resolved_language = resolved.get("language_code", "")
            if language_code and resolved_language != language_code:
                continue

            phrase = resolved.get("phrase", "")
            meaning = resolved.get("meaning", "")
            key = (resolved_language, phrase, meaning)

            if key not in grouped:
                # First time we see this pair is its most recent completion,
                # since event_rows is ordered newest-first.
                grouped[key] = {
                    "activity_id": entity_id,
                    "title": resolved.get("title", ""),
                    "phrase": phrase,
                    "native_script": resolved.get("native_script") or phrase,
                    "meaning": meaning,
                    "language_code": resolved_language,
                    "completed_at": row["occurred_at"],
                    "times_completed": 0,
                }
                order.append(key)

            grouped[key]["times_completed"] += 1

        return [grouped[key] for key in order]

    def get_completed_catalog_pairs(
        self,
        *,
        profile_id: str,
        language_code: str,
    ) -> set[tuple[str, str]]:
        """(phrase, meaning) pairs already completed for this profile and
        language. Used to steer new lesson generation toward catalog items
        the learner hasn't seen yet, instead of regenerating an overlapping
        set from the same small starter catalog."""
        words = self.get_learned_words(profile_id=profile_id, language_code=language_code)
        return {(word["phrase"], word["meaning"]) for word in words}

    def get_active_lesson_plan(
        self,
        *,
        profile_id: str,
        language_code: str,
    ) -> dict[str, Any] | None:
        with closing(self._connect()) as connection:
            plan = connection.execute(
                """
                SELECT plan_id, profile_id, language_code, source, tutor_model,
                       reviewer_model, reviewer_notes, created_at
                FROM lesson_plans
                WHERE profile_id = ? AND language_code = ? AND active = 1
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (profile_id, language_code),
            ).fetchone()
            if plan is None:
                return None

            items = connection.execute(
                """
                SELECT activity_id, title, prompt, phrase, meaning, native_script
                FROM lesson_items
                WHERE plan_id = ?
                ORDER BY item_index
                """,
                (plan["plan_id"],),
            ).fetchall()

        return {
            **dict(plan),
            "activities": [
                {
                    "id": item["activity_id"],
                    "title": item["title"],
                    "prompt": item["prompt"],
                    "phrase": item["phrase"],
                    "meaning": item["meaning"],
                    "native_script": item["native_script"] or item["phrase"],
                }
                for item in items
            ],
        }

    def save_lesson_plan(self, plan: dict[str, Any]) -> dict[str, Any]:
        with closing(self._connect()) as connection:
            connection.execute(
                """
                UPDATE lesson_plans
                SET active = 0
                WHERE profile_id = ? AND language_code = ?
                """,
                (plan["profile_id"], plan["language_code"]),
            )
            connection.execute(
                """
                INSERT INTO lesson_plans (
                    plan_id, profile_id, language_code, source, tutor_model,
                    reviewer_model, reviewer_notes, active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                """,
                (
                    plan["plan_id"],
                    plan["profile_id"],
                    plan["language_code"],
                    plan["source"],
                    plan.get("tutor_model", "unknown"),
                    plan.get("reviewer_model", "unknown"),
                    plan.get("reviewer_notes", ""),
                ),
            )
            for index, item in enumerate(plan.get("activities", [])):
                connection.execute(
                    """
                    INSERT INTO lesson_items (
                        plan_id, item_index, activity_id, title, prompt, phrase,
                        meaning, native_script
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        plan["plan_id"],
                        index,
                        item["id"],
                        item["title"],
                        item["prompt"],
                        item["phrase"],
                        item["meaning"],
                        item.get("native_script", item["phrase"]),
                    ),
                )
            connection.commit()
        return plan

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _seed_profiles(self, connection: sqlite3.Connection) -> None:
        for profile in SEED_PROFILES:
            connection.execute(
                """
                INSERT OR IGNORE INTO profiles (
                    id, display_name, type, age_group, explanation_language,
                    session_minutes
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    profile["id"],
                    profile["display_name"],
                    profile["type"],
                    profile["age_group"],
                    profile["explanation_language"],
                    profile["session_minutes"],
                ),
            )

    def _seed_languages(self, connection: sqlite3.Connection) -> None:
        for language in seed_languages():
            connection.execute(
                """
                INSERT INTO languages (
                    code, name, native_name, status, transliteration,
                    speech_to_text, text_to_speech, pronunciation
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(code) DO UPDATE SET
                    name = excluded.name,
                    native_name = excluded.native_name,
                    status = excluded.status,
                    transliteration = excluded.transliteration,
                    speech_to_text = excluded.speech_to_text,
                    text_to_speech = excluded.text_to_speech,
                    pronunciation = excluded.pronunciation
                """,
                (
                    language["code"],
                    language["name"],
                    language["native_name"],
                    language["status"],
                    int(language["transliteration"]),
                    int(language["speech_to_text"]),
                    int(language["text_to_speech"]),
                    language["pronunciation"],
                ),
            )
