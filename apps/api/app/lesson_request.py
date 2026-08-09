"""Best-effort parsing of a learner's free-form "teach me X" request into
lesson-generation hints (Stage 1.3, docs/product/roadmap-learning-features.md).

Deliberately simple regex/keyword heuristics, not an LLM call: this only
interprets the learner's own request text (in their explanation language,
usually English) to size and scope the lesson -- it does not touch
target-language phrase selection or pronunciation, so it does not fall under
the "tutoring engine must not contain language-specific branches such as
if language == 'kn'" architecture rule in CLAUDE.md. That rule is about the
target language being taught, not about reading the learner's own request.
"""

from __future__ import annotations

import re

_REVIEW_TERMS = (
    "review",
    "revise",
    "revision",
    "practice",
    "practise",
    "again",
    "repeat",
    "remind me",
    "went over",
)

_NEW_TERMS = (
    "new word",
    "new phrase",
    "new lesson",
    "haven't learned",
    "havent learned",
    "haven't seen",
    "havent seen",
    "something new",
    "more words",
    "teach me more",
)

_CONTINUE_TERMS = (
    "continue",
    "where i left off",
    "where i left",
    "carry on",
    "pick up",
    "keep going",
)

_COUNT_PATTERN = re.compile(r"\b(\d{1,2})\b")


def parse_lesson_request(text: str) -> dict[str, object]:
    """Returns a dict that may contain ``target_count`` (int) and/or
    ``mode`` ("review" | "new"), based on keyword/number matches in
    ``text``. Returns an empty dict for blank or uninterpretable text --
    callers should fall back to their existing defaults in that case,
    never fail the request over an unparseable phrase."""
    normalized = " ".join(text.strip().lower().split())
    if not normalized:
        return {}

    hints: dict[str, object] = {}

    count_match = _COUNT_PATTERN.search(normalized)
    if count_match:
        count = int(count_match.group(1))
        if 1 <= count <= 20:
            hints["target_count"] = count

    if any(term in normalized for term in _REVIEW_TERMS):
        hints["mode"] = "review"
    elif any(term in normalized for term in _NEW_TERMS) or any(
        term in normalized for term in _CONTINUE_TERMS
    ):
        hints["mode"] = "new"

    return hints
