from __future__ import annotations

import unittest
from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))

from tools.validate_language_packs import (
    DEFAULT_SCHEMA_PATH,
    LanguagePackValidationError,
    manifest_to_language_capability,
    validate_language_packs,
)


class LanguagePackValidationTest(unittest.TestCase):
    def test_kannada_and_hindi_manifests_validate(self) -> None:
        manifests = validate_language_packs(
            REPO_ROOT / "language_packs",
            DEFAULT_SCHEMA_PATH,
        )
        capabilities = [
            manifest_to_language_capability(manifest)
            for manifest in manifests
        ]

        self.assertIn("kn", {capability["code"] for capability in capabilities})
        self.assertIn("hi", {capability["code"] for capability in capabilities})
        kannada = next(capability for capability in capabilities if capability["code"] == "kn")
        hindi = next(capability for capability in capabilities if capability["code"] == "hi")
        self.assertEqual(kannada["status"], "full")
        self.assertTrue(kannada["text_to_speech"])
        self.assertEqual(hindi["status"], "preview")
        self.assertEqual(hindi["pronunciation"], "later")

    def test_invalid_manifest_reports_missing_required_field(self) -> None:
        with self.assertRaises(LanguagePackValidationError) as context:
            validate_language_packs(
                Path(__file__).resolve().parent / "fixtures" / "language_packs" / "invalid_missing_code",
                DEFAULT_SCHEMA_PATH,
            )

        self.assertIn("language.code", str(context.exception))

    def test_invalid_manifest_reports_bad_enum(self) -> None:
        with self.assertRaises(LanguagePackValidationError) as context:
            validate_language_packs(
                Path(__file__).resolve().parent / "fixtures" / "language_packs" / "invalid_bad_status",
                DEFAULT_SCHEMA_PATH,
            )

        self.assertIn("status", str(context.exception))
        self.assertIn("must be one of", str(context.exception))


if __name__ == "__main__":
    unittest.main()
