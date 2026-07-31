# Progress Domain

Progress is append-only and event-sourced.

Clients may create local progress events while offline, but the backend remains authoritative. Projections must be deterministic and rebuildable from events.

## Event Envelope

```json
{
  "event_id": "01JXYZ",
  "profile_id": "profile_abhilash",
  "device_id": "android_phone_01",
  "session_id": "session_kn_001",
  "event_type": "activity_completed",
  "entity_id": "kn_a1_lesson_01_activity_01",
  "occurred_at": "2026-07-31T08:10:12+05:30",
  "recorded_at": "2026-07-31T09:20:42+05:30",
  "client_sequence": 42,
  "payload": {
    "score": 0.85,
    "attempt_count": 2
  },
  "schema_version": 1
}
```

## Rules

- `event_id` is the idempotency key.
- `occurred_at` is learner action time.
- `recorded_at` is server receipt time.
- Server receipt order does not define learning order.
- Completed work is never erased by conflict resolution.
