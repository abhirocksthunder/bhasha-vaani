from __future__ import annotations

import unittest

from app.word_assistant import explain_word


class WordAssistantTest(unittest.TestCase):
    def test_returns_curated_kannada_word(self) -> None:
        response = explain_word(
            {
                "word": "water",
                "language_code": "kn",
                "model": "local_ollama",
            },
        )

        self.assertTrue(response["curated"])
        self.assertEqual(response["phrase"], "Neeru")
        self.assertEqual(response["model"], "local_ollama")

    def test_returns_provider_ready_fallback(self) -> None:
        response = explain_word(
            {
                "word": "airport",
                "language_code": "hi",
                "model": "frontier_later",
            },
        )

        self.assertFalse(response["curated"])
        self.assertIn("frontier_later", response["answer"])
        self.assertEqual(response["provider_status"], "fallback")

    def test_generates_unknown_word_with_local_provider(self) -> None:
        def fake_provider(**_: object) -> dict[str, object]:
            return {
                "answer": (
                    "Translated word: ಗಾಳಿ (gaali)\n"
                    "Meaning: ಗಾಳಿ means air.\n"
                    "Example: ಹೊರಗೆ ಗಾಳಿ ಚೆನ್ನಾಗಿದೆ (Horage gaali chennagide) - The air outside is good."
                ),
                "route": "local_ollama",
                "model": "test-local-model",
            }

        response = explain_word(
            {
                "word": "air",
                "language_code": "kn",
                "model": "local_ollama",
            },
            provider_generate=fake_provider,
        )

        self.assertFalse(response["curated"])
        self.assertEqual(response["provider_status"], "generated")
        self.assertEqual(response["model"], "test-local-model")
        self.assertIn("gaali", response["answer"])
        self.assertNotIn("ಹೊರಗೆ", response["answer"])


if __name__ == "__main__":
    unittest.main()
