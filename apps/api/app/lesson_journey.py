from __future__ import annotations

from typing import Any

from app.lesson_catalog import get_starter_activities


def recommend_lesson_journey(
    payload: dict[str, Any],
    progress_summary: dict[str, Any],
    active_plan: dict[str, Any] | None = None,
) -> dict[str, Any]:
    language_code = str(payload.get("language_code", "kn")).strip() or "kn"
    completed_count = int(progress_summary.get("completed_activities", 0))
    if active_plan is not None and active_plan.get("activities"):
        activities = []
        plan_activities = active_plan["activities"]
        next_index = min(completed_count, max(len(plan_activities) - 1, 0))
        for index, activity in enumerate(plan_activities):
            state = "completed" if index < completed_count else "next" if index == next_index else "upcoming"
            activities.append({**activity, "state": state})
        return {
            "profile_id": payload.get("profile_id", "profile_abhilash"),
            "language_code": language_code,
            "source": active_plan.get("source", "stored_lesson_plan"),
            "plan_id": active_plan.get("plan_id"),
            "current_activity_id": activities[next_index]["id"] if activities else None,
            "completed_activities": completed_count,
            "activities": activities,
        }

    base_activities = get_starter_activities(language_code) or get_starter_activities("kn")
    next_index = min(completed_count, max(len(base_activities) - 1, 0))

    activities = []
    for index, activity in enumerate(base_activities):
        state = "completed" if index < completed_count else "next" if index == next_index else "upcoming"
        activities.append({**activity, "state": state})

    return {
        "profile_id": payload.get("profile_id", "profile_abhilash"),
        "language_code": language_code,
        "source": "journey_rule_engine",
        "current_activity_id": activities[next_index]["id"] if activities else None,
        "completed_activities": completed_count,
        "activities": activities,
    }
