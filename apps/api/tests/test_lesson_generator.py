from __future__ import annotations

import json
import unittest

from app.lesson_generator import LessonGenerationError, generate_lesson_plan
from app.provider_gateway import ProviderGatewayError
from app.lesson_catalog import get_starter_activities


class LessonGeneratorTest(unittest.TestCase):
    def test_generates_plan_through_tutor_and_reviewer_models(self) -> None:
        calls: list[str] = []

        def fake_provider(**kwargs: object) -> dict[str, object]:
            calls.append(str(kwargs["route"]))
            answer = json.dumps(
                {
                    "activities": [
                        {
                            "title": f"Practice {index}",
                            "prompt": "Say the phrase aloud.",
                            "phrase": f"phrase {index}",
                            "meaning": f"meaning {index}",
                        }
                        for index in range(1, 6)
                    ],
                },
            )
            return {
                "answer": answer,
                "model": str(kwargs["route"]).removeprefix("ollama:"),
                "route": "local_ollama",
            }

        plan = generate_lesson_plan(
            {
                "profile_id": "profile_abhilash",
                "language_code": "zz",
                "tutor_model": "ollama:ornith:9b",
                "reviewer_model": "ollama:deepseek-r1:14b",
                "target_count": 5,
            },
            {"completed_activities": 2, "event_count": 4},
            provider_generate=fake_provider,
        )

        self.assertEqual(calls, ["ollama:ornith:9b", "ollama:deepseek-r1:14b"])
        self.assertEqual(plan["source"], "local_two_model_generation")
        self.assertEqual(plan["tutor_model"], "ornith:9b")
        self.assertEqual(plan["reviewer_model"], "deepseek-r1:14b")
        self.assertEqual(len(plan["activities"]), 5)
        self.assertEqual(plan["activities"][0]["state"], "next")

    def test_rejects_plan_when_reviewer_fails(self) -> None:
        def fake_provider(**kwargs: object) -> dict[str, object]:
            if str(kwargs["route"]) == "ollama:reviewer":
                raise ProviderGatewayError("empty response")
            return {
                "answer": json.dumps(
                    {
                        "activities": [
                            {
                                "title": f"Practice {index}",
                                "prompt": "Say the phrase aloud.",
                                "phrase": f"phrase {index}",
                                "meaning": f"meaning {index}",
                            }
                            for index in range(1, 5)
                        ],
                    },
                ),
                "model": "tutor",
                "route": "local_ollama",
            }

        with self.assertRaises(LessonGenerationError):
            generate_lesson_plan(
                {
                    "profile_id": "profile_abhilash",
                "language_code": "zz",
                    "tutor_model": "ollama:tutor",
                    "reviewer_model": "ollama:reviewer",
                    "target_count": 4,
                },
                {"completed_activities": 0, "event_count": 0},
                provider_generate=fake_provider,
            )

    def test_recovers_from_malformed_json_on_first_attempt(self) -> None:
        """A model that returns broken JSON once should get a corrective
        retry instead of failing the whole plan (Stage 1.1 reliability work)."""
        attempts: dict[str, int] = {"tutor": 0, "reviewer": 0}

        def valid_answer() -> str:
            return json.dumps(
                {
                    "activities": [
                        {
                            "title": f"Practice {index}",
                            "prompt": "Say the phrase aloud.",
                            "phrase": f"phrase {index}",
                            "meaning": f"meaning {index}",
                        }
                        for index in range(1, 5)
                    ],
                },
            )

        def fake_provider(**kwargs: object) -> dict[str, object]:
            route = str(kwargs["route"])
            key = "tutor" if route == "ollama:tutor" else "reviewer"
            attempts[key] += 1
            if key == "tutor" and attempts[key] == 1:
                # Truncated / malformed JSON on the first tutor attempt.
                return {"answer": '{"activities": [{"title": "Oops"', "model": "tutor", "route": "local_ollama"}
            return {"answer": valid_answer(), "model": key, "route": "local_ollama"}

        plan = generate_lesson_plan(
            {
                "profile_id": "profile_abhilash",
                "language_code": "zz",
                "tutor_model": "ollama:tutor",
                "reviewer_model": "ollama:reviewer",
                "target_count": 4,
            },
            {"completed_activities": 0, "event_count": 0},
            provider_generate=fake_provider,
        )

        self.assertEqual(attempts["tutor"], 2)
        self.assertEqual(len(plan["activities"]), 4)
        self.assertTrue(any("attempt 1" in entry for entry in plan["generation_diagnostics"]))

    def test_gives_up_after_max_attempts_with_diagnostics(self) -> None:
        def fake_provider(**kwargs: object) -> dict[str, object]:
            return {"answer": "not json at all", "model": "tutor", "route": "local_ollama"}

        with self.assertRaises(LessonGenerationError) as context:
            generate_lesson_plan(
                {
                    "profile_id": "profile_abhilash",
                    "language_code": "zz",
                    "tutor_model": "ollama:tutor",
                    "reviewer_model": "ollama:reviewer",
                    "target_count": 4,
                },
                {"completed_activities": 0, "event_count": 0},
                provider_generate=fake_provider,
            )

        self.assertEqual(len(context.exception.diagnostics), 3)
        self.assertIn("tutor", str(context.exception))

    def test_native_script_comes_from_catalog_not_model(self) -> None:
        """The model is never asked for native script, and even if it
        guessed one, the catalog's value must win so pronunciation/rendering
        stays correct regardless of model reliability."""
        catalog = get_starter_activities("kn")
        greeting = next(item for item in catalog if item["id"] == "kn_a1_starter_01")

        def fake_provider(**kwargs: object) -> dict[str, object]:
            return {
                "answer": json.dumps(
                    {
                        "activities": [
                            {
                                "title": "Greeting",
                                "prompt": "Say hello.",
                                "phrase": greeting["phrase"],
                                "meaning": greeting["meaning"],
                                # A model hallucinating the wrong script should
                                # be ignored in favor of the trusted catalog.
                                "native_script": "WRONG SCRIPT",
                            },
                            *[
                                {
                                    "title": item["title"],
                                    "prompt": item["prompt"],
                                    "phrase": item["phrase"],
                                    "meaning": item["meaning"],
                                }
                                for item in catalog[1:4]
                            ],
                        ],
                    },
                ),
                "model": "tutor",
                "route": "local_ollama",
            }

        plan = generate_lesson_plan(
            {
                "profile_id": "profile_abhilash",
                "language_code": "kn",
                "tutor_model": "ollama:tutor",
                "reviewer_model": "ollama:reviewer",
                "target_count": 4,
            },
            {"completed_activities": 0, "event_count": 0},
            provider_generate=fake_provider,
        )

        generated_greeting = next(
            item for item in plan["activities"] if item["phrase"] == greeting["phrase"]
        )
        self.assertEqual(generated_greeting["native_script"], greeting["native_script"])
        self.assertNotEqual(generated_greeting["native_script"], "WRONG SCRIPT")

    def test_tutor_prompt_prefers_uncompleted_catalog_phrases(self) -> None:
        """Regenerating a plan should steer the tutor model toward phrases
        the learner hasn't completed yet, instead of silently reproducing
        an overlapping set (the user-reported "same phrases again" issue)."""
        catalog = get_starter_activities("kn")
        already_learned = {(catalog[0]["phrase"], catalog[0]["meaning"])}
        captured_prompts: list[str] = []

        def fake_provider(**kwargs: object) -> dict[str, object]:
            captured_prompts.append(str(kwargs["prompt"]))
            return {
                "answer": json.dumps(
                    {
                        "activities": [
                            {
                                "title": item["title"],
                                "prompt": item["prompt"],
                                "phrase": item["phrase"],
                                "meaning": item["meaning"],
                            }
                            for item in catalog[1:5]
                        ],
                    },
                ),
                "model": "tutor",
                "route": "local_ollama",
            }

        generate_lesson_plan(
            {
                "profile_id": "profile_abhilash",
                "language_code": "kn",
                "tutor_model": "ollama:tutor",
                "reviewer_model": "ollama:tutor",
                "target_count": 4,
            },
            {"completed_activities": 1, "event_count": 1},
            provider_generate=fake_provider,
            completed_pairs=already_learned,
        )

        tutor_prompt = captured_prompts[0]
        self.assertIn("already completed 1 of", tutor_prompt)
        self.assertIn(catalog[1]["phrase"], tutor_prompt)

    def test_tops_up_plan_with_new_catalog_items_model_ignored(self) -> None:
        """Reproduces the user-reported case: candidates were approved into
        the catalog (so it grew past the original starter set), but the
        tutor/reviewer models kept re-picking only already-learned phrases.
        The backend should still surface some of the new catalog items in
        the final plan instead of relying purely on the model's choice."""
        catalog = get_starter_activities("kn")
        already_learned = {(item["phrase"], item["meaning"]) for item in catalog[:8]}

        def fake_provider(**kwargs: object) -> dict[str, object]:
            # Model stubbornly only returns already-learned phrases, as if
            # ignoring the "prefer not-yet-learned" prompt hint.
            return {
                "answer": json.dumps(
                    {
                        "activities": [
                            {
                                "title": item["title"],
                                "prompt": item["prompt"],
                                "phrase": item["phrase"],
                                "meaning": item["meaning"],
                            }
                            for item in catalog[:4]
                        ],
                    },
                ),
                "model": "tutor",
                "route": "local_ollama",
            }

        plan = generate_lesson_plan(
            {
                "profile_id": "profile_abhilash",
                "language_code": "kn",
                "tutor_model": "ollama:tutor",
                "reviewer_model": "ollama:tutor",
                "target_count": 4,
            },
            {"completed_activities": 8, "event_count": 8},
            provider_generate=fake_provider,
            completed_pairs=already_learned,
        )

        plan_pairs = {(item["phrase"], item["meaning"]) for item in plan["activities"]}
        new_pairs = {(item["phrase"], item["meaning"]) for item in catalog if (item["phrase"], item["meaning"]) not in already_learned}
        overlap = plan_pairs & new_pairs
        self.assertGreaterEqual(len(overlap), 2)

    def test_request_text_sizes_plan_without_explicit_target_count(self) -> None:
        """Stage 1.3: 'teach me X' launcher -- request_text alone (no
        explicit target_count in the payload) should size the plan."""
        catalog = get_starter_activities("kn")

        def fake_provider(**kwargs: object) -> dict[str, object]:
            return {
                "answer": json.dumps(
                    {
                        "activities": [
                            {
                                "title": item["title"],
                                "prompt": item["prompt"],
                                "phrase": item["phrase"],
                                "meaning": item["meaning"],
                            }
                            for item in catalog[:6]
                        ],
                    },
                ),
                "model": "tutor",
                "route": "local_ollama",
            }

        plan = generate_lesson_plan(
            {
                "profile_id": "profile_abhilash",
                "language_code": "kn",
                "tutor_model": "ollama:tutor",
                "reviewer_model": "ollama:tutor",
                "request_text": "give me 5 new words today",
            },
            {"completed_activities": 0, "event_count": 0},
            provider_generate=fake_provider,
        )

        self.assertEqual(len(plan["activities"]), 5)
        self.assertEqual(plan["request_interpretation"]["resolved_mode"], "new")
        self.assertEqual(plan["request_interpretation"]["resolved_target_count"], 5)

    def test_explicit_target_count_wins_over_request_text_hint(self) -> None:
        catalog = get_starter_activities("kn")

        def fake_provider(**kwargs: object) -> dict[str, object]:
            return {
                "answer": json.dumps(
                    {
                        "activities": [
                            {
                                "title": item["title"],
                                "prompt": item["prompt"],
                                "phrase": item["phrase"],
                                "meaning": item["meaning"],
                            }
                            for item in catalog[:6]
                        ],
                    },
                ),
                "model": "tutor",
                "route": "local_ollama",
            }

        plan = generate_lesson_plan(
            {
                "profile_id": "profile_abhilash",
                "language_code": "kn",
                "tutor_model": "ollama:tutor",
                "reviewer_model": "ollama:tutor",
                "request_text": "give me 5 new words today",
                "target_count": 6,
            },
            {"completed_activities": 0, "event_count": 0},
            provider_generate=fake_provider,
        )

        self.assertEqual(plan["request_interpretation"]["resolved_target_count"], 6)

    def test_review_request_uses_only_completed_phrases(self) -> None:
        """An explicit review request should not be topped up with
        not-yet-learned phrases (that would defeat the point of asking for
        review)."""
        catalog = get_starter_activities("kn")
        already_learned = {(item["phrase"], item["meaning"]) for item in catalog[:4]}
        captured_prompts: list[str] = []

        def fake_provider(**kwargs: object) -> dict[str, object]:
            captured_prompts.append(str(kwargs["prompt"]))
            return {
                "answer": json.dumps(
                    {
                        "activities": [
                            {
                                "title": item["title"],
                                "prompt": item["prompt"],
                                "phrase": item["phrase"],
                                "meaning": item["meaning"],
                            }
                            for item in catalog[:4]
                        ],
                    },
                ),
                "model": "tutor",
                "route": "local_ollama",
            }

        plan = generate_lesson_plan(
            {
                "profile_id": "profile_abhilash",
                "language_code": "kn",
                "tutor_model": "ollama:tutor",
                "reviewer_model": "ollama:tutor",
                "request_text": "let's review what we practiced",
                "target_count": 4,
            },
            {"completed_activities": 4, "event_count": 4},
            provider_generate=fake_provider,
            completed_pairs=already_learned,
        )

        self.assertEqual(plan["request_interpretation"]["resolved_mode"], "review")
        plan_pairs = {(item["phrase"], item["meaning"]) for item in plan["activities"]}
        self.assertTrue(plan_pairs.issubset(already_learned))
        self.assertIn("explicitly asked for a review session", captured_prompts[0])


if __name__ == "__main__":
    unittest.main()
