from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from app.progress_event import ProgressEventValidationError
from app.storage import BhashaVaaniStore


class BhashaVaaniStoreTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test.db"
        self.store = BhashaVaaniStore(self.db_path)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_seeds_profiles(self) -> None:
        profiles = self.store.list_profiles()

        self.assertGreaterEqual(len(profiles), 2)
        self.assertIn("profile_abhilash", {profile["id"] for profile in profiles})

    def test_progress_event_is_idempotent_and_persistent(self) -> None:
        event = {
            "event_id": "evt_test_001",
            "profile_id": "profile_abhilash",
            "device_id": "flutter_web_test",
            "session_id": "session_test",
            "event_type": "activity_completed",
            "entity_id": "kn_a1_lesson_01_activity_01",
            "occurred_at": "2026-07-31T17:30:00+05:30",
            "recorded_at": "2026-07-31T17:30:01+05:30",
            "client_sequence": 1,
            "payload": {"score": 1.0, "attempt_count": 1},
            "schema_version": 1,
        }

        first = self.store.record_progress_event(event)
        second = self.store.record_progress_event(event)
        summary = self.store.progress_summary("profile_abhilash")

        reopened_store = BhashaVaaniStore(self.db_path)
        reopened_summary = reopened_store.progress_summary("profile_abhilash")

        self.assertFalse(first["duplicate"])
        self.assertTrue(second["duplicate"])
        self.assertEqual(summary["completed_activities"], 1)
        self.assertEqual(summary["event_count"], 1)
        self.assertEqual(reopened_summary["event_count"], 1)

    def test_missing_event_id_is_rejected(self) -> None:
        with self.assertRaises(ProgressEventValidationError):
            self.store.record_progress_event(
                {
                    "profile_id": "profile_abhilash",
                    "event_type": "activity_completed",
                    "entity_id": "activity",
                    "occurred_at": "2026-07-31T17:30:00+05:30",
                    "recorded_at": "2026-07-31T17:30:01+05:30",
                },
            )


if __name__ == "__main__":
    unittest.main()
