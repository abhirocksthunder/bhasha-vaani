from __future__ import annotations

import unittest

from app.lesson_catalog import get_starter_activities


class LessonCatalogTest(unittest.TestCase):
    def test_kannada_catalog_includes_native_script(self) -> None:
        activities = get_starter_activities("kn")

        # The Catalog tab (apps/api/app/catalog_generator.py) grows this
        # catalog over time via human-approved candidates, so this asserts
        # a floor (the original hand-authored 12) rather than an exact
        # count that would break every time the catalog legitimately grows.
        self.assertGreaterEqual(len(activities), 12)
        greeting = next(item for item in activities if item["id"] == "kn_a1_starter_01")
        self.assertEqual(greeting["phrase"], "Namaskara")
        self.assertEqual(greeting["native_script"], "ನಮಸ್ಕಾರ")

    def test_hindi_catalog_includes_native_script(self) -> None:
        activities = get_starter_activities("hi")

        self.assertGreaterEqual(len(activities), 6)
        greeting = next(item for item in activities if item["id"] == "hi_a1_starter_01")
        self.assertEqual(greeting["phrase"], "Namaste")
        self.assertEqual(greeting["native_script"], "नमस्ते")

    def test_unknown_language_returns_empty_list(self) -> None:
        self.assertEqual(get_starter_activities("zz"), [])


if __name__ == "__main__":
    unittest.main()
