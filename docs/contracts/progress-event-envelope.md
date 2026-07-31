# Progress Event Envelope

Progress events are append-only. Every client must send the same envelope shape when recording learner progress.

```json
{
  "event_id": "evt_profile_abhilash_kn_a1_lesson_01_activity_01_1",
  "profile_id": "profile_abhilash",
  "device_id": "flutter_web_dev",
  "session_id": "session_profile_abhilash_kn_starter",
  "event_type": "activity_completed",
  "entity_id": "kn_a1_lesson_01_activity_01",
  "occurred_at": "2026-07-31T18:30:00+05:30",
  "recorded_at": "2026-07-31T18:30:01+05:30",
  "client_sequence": 1,
  "payload": {
    "score": 1.0,
    "attempt_count": 1
  },
  "schema_version": 1
}
```

## Rules

- `event_id` is the idempotency key.
- `occurred_at` is when the learner performed the action.
- `recorded_at` is when the event was recorded by the client or accepted by the server.
- `client_sequence` is device-local ordering.
- `payload` must be an object, even when empty.
- Projections must be rebuildable from stored events.
