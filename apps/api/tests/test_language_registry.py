from __future__ import annotations

import unittest

from app.language_registry import LanguageRegistry


class LanguageRegistryTest(unittest.TestCase):
    def test_registry_returns_manifest_capabilities(self) -> None:
        languages = LanguageRegistry().list_languages()
        language_by_code = {
            language["code"]: language
            for language in languages
        }

        self.assertEqual(language_by_code["kn"]["status"], "full")
        self.assertTrue(language_by_code["kn"]["text_to_speech"])
        self.assertEqual(language_by_code["hi"]["status"], "preview")
        self.assertFalse(language_by_code["hi"]["text_to_speech"])


if __name__ == "__main__":
    unittest.main()
