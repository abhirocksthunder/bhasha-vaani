from __future__ import annotations

import json
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Any

from app.language_registry import LanguageRegistry
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
                """
            )
            self._seed_profiles(connection)
            self._seed_languages(connection)
            connection.commit()

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

    def progress_summary(self, profile_id: str) -> dict[str, Any]:
        with closing(self._connect()) as connection:
            row = connection.execute(
                """
                SELECT
                    COUNT(*) AS event_count,
                    COUNT(DISTINCT CASE
                        WHEN event_type = 'activity_completed' THEN entity_id
                    END) AS completed_activities
                FROM progress_events
                WHERE profile_id = ?
                """,
                (profile_id,),
            ).fetchone()

        return {
            "profile_id": profile_id,
            "completed_activities": row["completed_activities"],
            "pending_reviews": 6,
            "current_lesson": "Starter lesson 1",
            "sync_state": "SQLite projection",
            "event_count": row["event_count"],
        }

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
