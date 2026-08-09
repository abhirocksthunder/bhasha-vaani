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
            # Must resolve to a real starter-catalog activity: progress_summary's
            # completed_activities now reuses get_learned_words's dedup, which
            # skips events that can't be resolved to a known phrase (see
            # BV-PROGRESS-SCOPE-001).
            "entity_id": "kn_a1_starter_01",
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

    def test_progress_summary_is_scoped_per_language_and_deduped(self) -> None:
        """Reproduces the user-reported bug: completed_activities used to be
        a raw distinct-entity_id count across ALL languages, so a learner
        doing Hindi lessons inflated the count used by Kannada's
        lesson-journey next_index/state calc -- once that inflated count
        exceeded the Kannada catalog size, every Kannada activity showed as
        already "completed" with nothing left to learn."""
        # Two Hindi completions and one Kannada completion.
        for index, entity_id in enumerate(["hi_a1_starter_01", "hi_a1_starter_02", "kn_a1_starter_01"]):
            self.store.record_progress_event(
                {
                    "event_id": f"evt_lang_scope_{index}",
                    "profile_id": "profile_abhilash",
                    "device_id": "device_1",
                    "session_id": "session_1",
                    "event_type": "activity_completed",
                    "entity_id": entity_id,
                    "occurred_at": f"2026-07-31T1{index}:00:00+05:30",
                    "recorded_at": f"2026-07-31T1{index}:00:01+05:30",
                    "client_sequence": index + 1,
                    "payload": {},
                    "schema_version": 1,
                },
            )

        kn_summary = self.store.progress_summary("profile_abhilash", language_code="kn")
        hi_summary = self.store.progress_summary("profile_abhilash", language_code="hi")
        global_summary = self.store.progress_summary("profile_abhilash")

        self.assertEqual(kn_summary["completed_activities"], 1)
        self.assertEqual(hi_summary["completed_activities"], 2)
        self.assertEqual(global_summary["completed_activities"], 3)

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

    def test_lesson_plan_is_persistent_and_active(self) -> None:
        plan = {
            "plan_id": "plan_profile_abhilash_kn_test",
            "profile_id": "profile_abhilash",
            "language_code": "kn",
            "source": "local_two_model_generation",
            "tutor_model": "ornith:9b",
            "reviewer_model": "deepseek-r1:14b",
            "reviewer_notes": "ok",
            "activities": [
                {
                    "id": "activity_generated_01",
                    "title": "Market phrase",
                    "prompt": "Practise a useful market phrase.",
                    "phrase": "Ondu kodi",
                    "meaning": "Give one",
                    "native_script": "ಒಂದು ಕೊಡಿ",
                },
            ],
        }

        self.store.save_lesson_plan(plan)
        reopened_store = BhashaVaaniStore(self.db_path)
        active_plan = reopened_store.get_active_lesson_plan(
            profile_id="profile_abhilash",
            language_code="kn",
        )

        self.assertIsNotNone(active_plan)
        self.assertEqual(active_plan["plan_id"], "plan_profile_abhilash_kn_test")
        self.assertEqual(active_plan["activities"][0]["phrase"], "Ondu kodi")
        # native_script must survive a save + reload round trip, otherwise
        # text-to-speech silently regresses to reading the romanized phrase
        # the moment a generated plan is reloaded from storage.
        self.assertEqual(active_plan["activities"][0]["native_script"], "ಒಂದು ಕೊಡಿ")

    def test_lesson_plan_without_native_script_falls_back_to_phrase(self) -> None:
        plan = {
            "plan_id": "plan_profile_abhilash_kn_test2",
            "profile_id": "profile_abhilash",
            "language_code": "kn",
            "source": "local_two_model_generation",
            "tutor_model": "ornith:9b",
            "reviewer_model": "deepseek-r1:14b",
            "reviewer_notes": "ok",
            "activities": [
                {
                    "id": "activity_generated_02",
                    "title": "Greeting",
                    "prompt": "Say hello.",
                    "phrase": "Namaskara",
                    "meaning": "Hello",
                    # no native_script key at all
                },
            ],
        }

        self.store.save_lesson_plan(plan)
        active_plan = self.store.get_active_lesson_plan(
            profile_id="profile_abhilash",
            language_code="kn",
        )

        self.assertEqual(active_plan["activities"][0]["native_script"], "Namaskara")

    def test_learned_words_resolves_catalog_and_generated_activities(self) -> None:
        # A catalog (starter) completion.
        self.store.record_progress_event(
            {
                "event_id": "evt_catalog_01",
                "profile_id": "profile_abhilash",
                "device_id": "device_1",
                "session_id": "session_1",
                "event_type": "activity_completed",
                "entity_id": "kn_a1_starter_01",
                "occurred_at": "2026-07-31T09:00:00+05:30",
                "recorded_at": "2026-07-31T09:00:01+05:30",
                "client_sequence": 1,
                "payload": {},
                "schema_version": 1,
            },
        )

        # A generated-plan completion.
        self.store.save_lesson_plan(
            {
                "plan_id": "plan_profile_abhilash_kn_hist",
                "profile_id": "profile_abhilash",
                "language_code": "kn",
                "source": "local_two_model_generation",
                "tutor_model": "ornith:9b",
                "reviewer_model": "ornith:9b",
                "reviewer_notes": "ok",
                "activities": [
                    {
                        "id": "plan_profile_abhilash_kn_hist_activity_01",
                        "title": "Market phrase",
                        "prompt": "Practise asking a price.",
                        "phrase": "Idakke enu bele",
                        "meaning": "What is the price of this",
                        "native_script": "ಇದಕ್ಕೆ ಎಷ್ಟು ಬೆಲೆ",
                    },
                ],
            },
        )
        self.store.record_progress_event(
            {
                "event_id": "evt_generated_01",
                "profile_id": "profile_abhilash",
                "device_id": "device_1",
                "session_id": "session_1",
                "event_type": "activity_completed",
                "entity_id": "plan_profile_abhilash_kn_hist_activity_01",
                "occurred_at": "2026-07-31T10:00:00+05:30",
                "recorded_at": "2026-07-31T10:00:01+05:30",
                "client_sequence": 1,
                "payload": {},
                "schema_version": 1,
            },
        )

        # An event that can't be resolved to any known activity should be
        # skipped rather than shown with blank text.
        self.store.record_progress_event(
            {
                "event_id": "evt_unresolvable_01",
                "profile_id": "profile_abhilash",
                "device_id": "device_1",
                "session_id": "session_1",
                "event_type": "activity_completed",
                "entity_id": "some_deleted_activity_id",
                "occurred_at": "2026-07-31T08:00:00+05:30",
                "recorded_at": "2026-07-31T08:00:01+05:30",
                "client_sequence": 1,
                "payload": {},
                "schema_version": 1,
            },
        )

        words = self.store.get_learned_words(profile_id="profile_abhilash")

        self.assertEqual(len(words), 2)
        # Newest first.
        self.assertEqual(words[0]["activity_id"], "plan_profile_abhilash_kn_hist_activity_01")
        self.assertEqual(words[0]["native_script"], "ಇದಕ್ಕೆ ಎಷ್ಟು ಬೆಲೆ")
        self.assertEqual(words[0]["language_code"], "kn")
        self.assertEqual(words[0]["times_completed"], 1)
        self.assertEqual(words[1]["activity_id"], "kn_a1_starter_01")
        self.assertEqual(words[1]["phrase"], "Namaskara")
        self.assertEqual(words[1]["times_completed"], 1)

    def test_learned_words_filters_by_language_and_dedupes_repeats(self) -> None:
        for index, event_id in enumerate(["evt_repeat_01", "evt_repeat_02"]):
            self.store.record_progress_event(
                {
                    "event_id": event_id,
                    "profile_id": "profile_abhilash",
                    "device_id": "device_1",
                    "session_id": "session_1",
                    "event_type": "activity_completed",
                    "entity_id": "kn_a1_starter_02",
                    "occurred_at": f"2026-07-31T0{9 + index}:00:00+05:30",
                    "recorded_at": f"2026-07-31T0{9 + index}:00:01+05:30",
                    "client_sequence": index + 1,
                    "payload": {},
                    "schema_version": 1,
                },
            )

        words = self.store.get_learned_words(profile_id="profile_abhilash", language_code="kn")
        self.assertEqual(len(words), 1)
        self.assertEqual(words[0]["times_completed"], 2)

        no_hindi_words = self.store.get_learned_words(profile_id="profile_abhilash", language_code="hi")
        self.assertEqual(no_hindi_words, [])

    def test_learned_words_dedupes_same_phrase_across_different_generated_plans(self) -> None:
        """Reproduces the user-reported issue: regenerating a plan gives the
        same catalog phrase a brand-new activity_id each time, so completing
        it again used to show up as a separate "duplicate" history row
        instead of incrementing a count on the same word."""
        for plan_suffix in ("a", "b"):
            self.store.save_lesson_plan(
                {
                    "plan_id": f"plan_profile_abhilash_kn_{plan_suffix}",
                    "profile_id": "profile_abhilash",
                    "language_code": "kn",
                    "source": "local_two_model_generation",
                    "tutor_model": "gemma4:latest",
                    "reviewer_model": "gemma4:latest",
                    "reviewer_notes": "ok",
                    "activities": [
                        {
                            "id": f"plan_profile_abhilash_kn_{plan_suffix}_activity_01",
                            "title": "Greeting",
                            "prompt": "Say hello.",
                            "phrase": "Namaskara",
                            "meaning": "Hello",
                            "native_script": "ನಮಸ್ಕಾರ",
                        },
                    ],
                },
            )

        for index, plan_suffix in enumerate(("a", "b")):
            self.store.record_progress_event(
                {
                    "event_id": f"evt_repeat_plan_{plan_suffix}",
                    "profile_id": "profile_abhilash",
                    "device_id": "device_1",
                    "session_id": "session_1",
                    "event_type": "activity_completed",
                    "entity_id": f"plan_profile_abhilash_kn_{plan_suffix}_activity_01",
                    "occurred_at": f"2026-07-31T1{index}:00:00+05:30",
                    "recorded_at": f"2026-07-31T1{index}:00:01+05:30",
                    "client_sequence": index + 1,
                    "payload": {},
                    "schema_version": 1,
                },
            )

        words = self.store.get_learned_words(profile_id="profile_abhilash", language_code="kn")

        self.assertEqual(len(words), 1)
        self.assertEqual(words[0]["phrase"], "Namaskara")
        self.assertEqual(words[0]["times_completed"], 2)
        # Most recent completion (plan "b") wins for completed_at/activity_id.
        self.assertEqual(words[0]["activity_id"], "plan_profile_abhilash_kn_b_activity_01")


if __name__ == "__main__":
    unittest.main()
