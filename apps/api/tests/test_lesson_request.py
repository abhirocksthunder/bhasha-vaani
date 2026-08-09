from __future__ import annotations

import unittest

from app.lesson_request import parse_lesson_request


class LessonRequestTest(unittest.TestCase):
    def test_blank_text_returns_no_hints(self) -> None:
        self.assertEqual(parse_lesson_request(""), {})
        self.assertEqual(parse_lesson_request("   "), {})

    def test_extracts_count(self) -> None:
        hints = parse_lesson_request("give me 5 new words today")
        self.assertEqual(hints["target_count"], 5)

    def test_ignores_out_of_range_count(self) -> None:
        hints = parse_lesson_request("give me 99 words")
        self.assertNotIn("target_count", hints)

    def test_detects_review_mode(self) -> None:
        hints = parse_lesson_request("let's review what we did yesterday")
        self.assertEqual(hints["mode"], "review")

    def test_detects_new_mode_from_new_phrasing(self) -> None:
        hints = parse_lesson_request("teach me some new phrases")
        self.assertEqual(hints["mode"], "new")

    def test_detects_new_mode_from_continue_phrasing(self) -> None:
        hints = parse_lesson_request("continue where I left off")
        self.assertEqual(hints["mode"], "new")

    def test_combines_count_and_mode(self) -> None:
        hints = parse_lesson_request("review 6 words with me")
        self.assertEqual(hints["target_count"], 6)
        self.assertEqual(hints["mode"], "review")

    def test_unrecognized_phrasing_returns_no_mode(self) -> None:
        hints = parse_lesson_request("teach me Kannada today")
        self.assertNotIn("mode", hints)


if __name__ == "__main__":
    unittest.main()
