from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


REQUIRED_PROGRESS_EVENT_FIELDS = (
    "event_id",
    "profile_id",
    "device_id",
    "session_id",
    "event_type",
    "entity_id",
    "occurred_at",
    "recorded_at",
    "client_sequence",
    "payload",
    "schema_version",
)

CURRENT_PROGRESS_EVENT_SCHEMA_VERSION = 1


@dataclass(frozen=True)
class ProgressEventEnvelope:
    event_id: str
    profile_id: str
    device_id: str
    session_id: str
    event_type: str
    entity_id: str
    occurred_at: str
    recorded_at: str
    client_sequence: int
    payload: dict[str, Any] = field(default_factory=dict)
    schema_version: int = 1

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ProgressEventEnvelope":
        missing = [
            field_name
            for field_name in REQUIRED_PROGRESS_EVENT_FIELDS
            if field_name not in data
        ]
        if missing:
            raise ProgressEventValidationError(
                f"missing_required_fields:{','.join(missing)}",
            )

        payload = data["payload"]
        if not isinstance(payload, dict):
            raise ProgressEventValidationError("payload_must_be_object")

        schema_version = int(data["schema_version"])
        if schema_version != CURRENT_PROGRESS_EVENT_SCHEMA_VERSION:
            raise ProgressEventValidationError(
                f"unsupported_schema_version:{schema_version}",
            )

        return cls(
            event_id=_required_string(data, "event_id"),
            profile_id=_required_string(data, "profile_id"),
            device_id=_required_string(data, "device_id"),
            session_id=_required_string(data, "session_id"),
            event_type=_required_string(data, "event_type"),
            entity_id=_required_string(data, "entity_id"),
            occurred_at=_required_string(data, "occurred_at"),
            recorded_at=_required_string(data, "recorded_at"),
            client_sequence=int(data["client_sequence"]),
            payload=payload,
            schema_version=schema_version,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "event_id": self.event_id,
            "profile_id": self.profile_id,
            "device_id": self.device_id,
            "session_id": self.session_id,
            "event_type": self.event_type,
            "entity_id": self.entity_id,
            "occurred_at": self.occurred_at,
            "recorded_at": self.recorded_at,
            "client_sequence": self.client_sequence,
            "payload": self.payload,
            "schema_version": self.schema_version,
        }


class ProgressEventValidationError(ValueError):
    pass


def _required_string(data: dict[str, Any], field_name: str) -> str:
    value = data[field_name]
    if not isinstance(value, str) or not value.strip():
        raise ProgressEventValidationError(f"{field_name}_must_be_string")
    return value
