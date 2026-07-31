from __future__ import annotations

import unittest

from app.progress_event import ProgressEventEnvelope, ProgressEventValidationError


class ProgressEventEnvelopeTest(unittest.TestCase):
    def test_parses_valid_envelope(self) -> None:
        envelope = ProgressEventEnvelope.from_dict(
            {
                "event_id": "evt_contract_001",
                "profile_id": "profile_abhilash",
                "device_id": "flutter_web_test",
                "session_id": "session_contract",
                "event_type": "activity_completed",
                "entity_id": "activity_contract",
                "occurred_at": "2026-07-31T18:30:00+05:30",
                "recorded_at": "2026-07-31T18:30:01+05:30",
                "client_sequence": 1,
                "payload": {"score": 1.0},
                "schema_version": 1,
            },
        )

        self.assertEqual(envelope.event_id, "evt_contract_001")
        self.assertEqual(envelope.to_dict()["event_type"], "activity_completed")

    def test_requires_all_envelope_fields(self) -> None:
        with self.assertRaisesRegex(
            ProgressEventValidationError,
            "missing_required_fields",
        ):
            ProgressEventEnvelope.from_dict(
                {
                    "event_id": "evt_contract_001",
                    "profile_id": "profile_abhilash",
                },
            )

    def test_payload_must_be_object(self) -> None:
        with self.assertRaisesRegex(
            ProgressEventValidationError,
            "payload_must_be_object",
        ):
            ProgressEventEnvelope.from_dict(
                {
                    "event_id": "evt_contract_001",
                    "profile_id": "profile_abhilash",
                    "device_id": "flutter_web_test",
                    "session_id": "session_contract",
                    "event_type": "activity_completed",
                    "entity_id": "activity_contract",
                    "occurred_at": "2026-07-31T18:30:00+05:30",
                    "recorded_at": "2026-07-31T18:30:01+05:30",
                    "client_sequence": 1,
                    "payload": [],
                    "schema_version": 1,
                },
            )

    def test_rejects_unsupported_schema_version(self) -> None:
        with self.assertRaisesRegex(
            ProgressEventValidationError,
            "unsupported_schema_version:2",
        ):
            ProgressEventEnvelope.from_dict(
                {
                    "event_id": "evt_contract_002",
                    "profile_id": "profile_abhilash",
                    "device_id": "flutter_web_test",
                    "session_id": "session_contract",
                    "event_type": "activity_completed",
                    "entity_id": "activity_contract",
                    "occurred_at": "2026-07-31T18:30:00+05:30",
                    "recorded_at": "2026-07-31T18:30:01+05:30",
                    "client_sequence": 1,
                    "payload": {"score": 1.0},
                    "schema_version": 2,
                },
            )


if __name__ == "__main__":
    unittest.main()
