from __future__ import annotations

import json
import tempfile
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

import dev_server
from app.storage import BhashaVaaniStore


class DevServerRouteTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.store = BhashaVaaniStore(Path(self.temp_dir.name) / "test.db")
        dev_server.STORE = self.store
        self.server = ThreadingHTTPServer(
            ("127.0.0.1", 0),
            dev_server.BhashaVaaniDevHandler,
        )
        self.thread = threading.Thread(
            target=self.server.serve_forever,
            daemon=True,
        )
        self.thread.start()
        host, port = self.server.server_address
        self.base_url = f"http://{host}:{port}"

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temp_dir.cleanup()

    def test_profiles_route(self) -> None:
        profiles = self._get_json("/profiles")

        self.assertEqual(len(profiles), 2)
        self.assertEqual(profiles[0]["id"], "profile_abhilash")

    def test_languages_route_uses_manifest_registry(self) -> None:
        languages = self._get_json("/languages")

        language_by_code = {
            language["code"]: language
            for language in languages
        }
        self.assertEqual(language_by_code["kn"]["status"], "full")
        self.assertEqual(language_by_code["hi"]["status"], "preview")

    def test_progress_event_route_is_idempotent(self) -> None:
        event = {
            "event_id": "evt_route_001",
            "profile_id": "profile_abhilash",
            "device_id": "route_test",
            "session_id": "session_route",
            "event_type": "activity_completed",
            "entity_id": "activity_route",
            "occurred_at": "2026-07-31T18:15:00+05:30",
            "recorded_at": "2026-07-31T18:15:01+05:30",
            "client_sequence": 1,
            "payload": {"score": 1.0},
            "schema_version": 1,
        }

        first = self._post_json("/progress/events", event)
        second = self._post_json("/progress/events", event)
        summary = self._get_json("/profiles/profile_abhilash/progress")

        self.assertFalse(first["duplicate"])
        self.assertTrue(second["duplicate"])
        self.assertEqual(summary["event_count"], 1)

    def test_word_assistant_route(self) -> None:
        response = self._post_json(
            "/assistant/word",
            {
                "word": "hello",
                "language_code": "hi",
                "model": "local_lmstudio",
            },
        )

        self.assertTrue(response["curated"])
        self.assertEqual(response["phrase"], "Namaste")

    def test_lesson_journey_route_uses_progress(self) -> None:
        event = {
            "event_id": "evt_route_lesson_001",
            "profile_id": "profile_abhilash",
            "device_id": "route_test",
            "session_id": "session_route",
            "event_type": "activity_completed",
            # Must resolve to a real starter-catalog activity -- see the note
            # in test_storage.py's idempotency test for why.
            "entity_id": "kn_a1_starter_01",
            "occurred_at": "2026-07-31T18:15:00+05:30",
            "recorded_at": "2026-07-31T18:15:01+05:30",
            "client_sequence": 1,
            "payload": {"score": 1.0},
            "schema_version": 1,
        }

        self._post_json("/progress/events", event)
        response = self._post_json(
            "/lesson-journey",
            {
                "profile_id": "profile_abhilash",
                "language_code": "kn",
            },
        )

        self.assertEqual(response["source"], "journey_rule_engine")
        self.assertEqual(response["completed_activities"], 1)
        self.assertEqual(response["activities"][0]["state"], "completed")
        self.assertEqual(response["activities"][1]["state"], "next")

    def test_lesson_journey_route_prefers_active_plan(self) -> None:
        self.store.save_lesson_plan(
            {
                "plan_id": "plan_route_generated",
                "profile_id": "profile_abhilash",
                "language_code": "kn",
                "source": "local_two_model_generation",
                "tutor_model": "ornith:9b",
                "reviewer_model": "deepseek-r1:14b",
                "reviewer_notes": "ok",
                "activities": [
                    {
                        "id": "generated_activity_01",
                        "title": "Generated",
                        "prompt": "Practise a generated phrase.",
                        "phrase": "Sari",
                        "meaning": "Okay",
                    },
                ],
            },
        )

        response = self._post_json(
            "/lesson-journey",
            {
                "profile_id": "profile_abhilash",
                "language_code": "kn",
            },
        )

        self.assertEqual(response["source"], "local_two_model_generation")
        self.assertEqual(response["plan_id"], "plan_route_generated")
        self.assertEqual(response["activities"][0]["id"], "generated_activity_01")

    def _get_json(self, path: str) -> object:
        with urllib.request.urlopen(f"{self.base_url}{path}") as response:
            return json.loads(response.read().decode("utf-8"))

    def _post_json(self, path: str, payload: object) -> object:
        body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"{self.base_url}{path}",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))


if __name__ == "__main__":
    unittest.main()
