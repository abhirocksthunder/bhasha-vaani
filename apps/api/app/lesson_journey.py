from __future__ import annotations

from typing import Any


STARTER_ACTIVITIES: dict[str, list[dict[str, str]]] = {
    "kn": [
        {
            "id": "kn_a1_lesson_01_activity_01",
            "title": "Greeting",
            "prompt": "Listen and repeat a basic Kannada greeting.",
            "phrase": "Namaskara",
            "meaning": "Hello",
        },
        {
            "id": "kn_a1_lesson_01_activity_02",
            "title": "Useful phrase",
            "prompt": "Practise asking for water.",
            "phrase": "Nanage neeru beku",
            "meaning": "I need water",
        },
        {
            "id": "kn_a1_lesson_01_activity_03",
            "title": "Thank you",
            "prompt": "Practise a polite everyday phrase.",
            "phrase": "Dhanyavaadagalu",
            "meaning": "Thank you",
        },
        {
            "id": "kn_a1_lesson_01_activity_04",
            "title": "Yes",
            "prompt": "Say a simple confirmation.",
            "phrase": "Howdu",
            "meaning": "Yes",
        },
        {
            "id": "kn_a1_lesson_01_activity_05",
            "title": "No",
            "prompt": "Say a simple refusal.",
            "phrase": "Illa",
            "meaning": "No",
        },
        {
            "id": "kn_a1_lesson_01_activity_06",
            "title": "How are you?",
            "prompt": "Practise a friendly question.",
            "phrase": "Hegiddira?",
            "meaning": "How are you?",
        },
    ],
    "hi": [
        {
            "id": "hi_a1_lesson_01_activity_01",
            "title": "Greeting",
            "prompt": "Listen and repeat a basic Hindi greeting.",
            "phrase": "Namaste",
            "meaning": "Hello",
        },
        {
            "id": "hi_a1_lesson_01_activity_02",
            "title": "Useful phrase",
            "prompt": "Practise asking for water.",
            "phrase": "Mujhe paani chahiye",
            "meaning": "I need water",
        },
        {
            "id": "hi_a1_lesson_01_activity_03",
            "title": "Thank you",
            "prompt": "Practise a polite everyday phrase.",
            "phrase": "Dhanyavaad",
            "meaning": "Thank you",
        },
    ],
}


def recommend_lesson_journey(
    payload: dict[str, Any],
    progress_summary: dict[str, Any],
) -> dict[str, Any]:
    language_code = str(payload.get("language_code", "kn")).strip() or "kn"
    completed_count = int(progress_summary.get("completed_activities", 0))
    base_activities = STARTER_ACTIVITIES.get(language_code, STARTER_ACTIVITIES["kn"])
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
