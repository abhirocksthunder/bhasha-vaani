from __future__ import annotations

from collections.abc import Callable
import re
from typing import Any

from app.provider_gateway import ProviderGatewayError, generate_with_ollama


KNOWN_WORDS: dict[str, dict[str, dict[str, str]]] = {
    "kn": {
        "hello": {
            "phrase": "Namaskara",
            "meaning": "Hello",
            "usage": "A respectful everyday greeting.",
        },
        "water": {
            "phrase": "Neeru",
            "meaning": "Water",
            "usage": "Use it in 'Nanage neeru beku' for 'I need water'.",
        },
        "thank you": {
            "phrase": "Dhanyavaadagalu",
            "meaning": "Thank you",
            "usage": "A polite way to say thanks.",
        },
        "yes": {
            "phrase": "Howdu",
            "meaning": "Yes",
            "usage": "A simple confirmation.",
        },
        "no": {
            "phrase": "Illa",
            "meaning": "No",
            "usage": "A simple refusal.",
        },
    },
    "hi": {
        "hello": {
            "phrase": "Namaste",
            "meaning": "Hello",
            "usage": "A common respectful greeting.",
        },
        "water": {
            "phrase": "Paani",
            "meaning": "Water",
            "usage": "Use it in 'Mujhe paani chahiye' for 'I need water'.",
        },
        "thank you": {
            "phrase": "Dhanyavaad",
            "meaning": "Thank you",
            "usage": "A polite way to say thanks.",
        },
        "yes": {
            "phrase": "Haan",
            "meaning": "Yes",
            "usage": "A simple confirmation.",
        },
        "no": {
            "phrase": "Nahi",
            "meaning": "No",
            "usage": "A simple refusal.",
        },
    },
}


ProviderGenerate = Callable[..., dict[str, Any]]


def explain_word(
    payload: dict[str, Any],
    provider_generate: ProviderGenerate = generate_with_ollama,
) -> dict[str, Any]:
    word = str(payload.get("word", "")).strip()
    language_code = str(payload.get("language_code", "kn")).strip() or "kn"
    model = str(payload.get("model", "local_ollama")).strip() or "local_ollama"
    explanation_language = str(payload.get("explanation_language", "English")).strip() or "English"
    normalized_word = word.lower()
    match = KNOWN_WORDS.get(language_code, {}).get(normalized_word)

    if match is None:
        prompt = _build_word_prompt(
            word=word,
            language_code=language_code,
            explanation_language=explanation_language,
        )
        try:
            generated = provider_generate(prompt=prompt, route=model)
        except ProviderGatewayError as error:
            answer = (
                f"I tried the selected local Ollama model for '{word}', but generation failed. "
                f"Provider detail: {error}"
            )
            return {
                "word": word,
                "language_code": language_code,
                "explanation_language": explanation_language,
                "model": model,
                "answer": answer,
                "curated": False,
                "provider_status": "fallback",
            }

        answer = _sanitize_unreadable_target_script(
            str(generated["answer"]),
            language_code=language_code,
        )
        return {
            "word": word,
            "language_code": language_code,
            "explanation_language": explanation_language,
            "model": generated.get("model", model),
            "provider_route": generated.get("route", model),
            "answer": answer,
            "curated": False,
            "provider_status": "generated",
        }

    answer = (
        f"{match['meaning']} in {language_code}: {match['phrase']}. "
        f"{match['usage']}"
    )
    return {
        "word": word,
        "language_code": language_code,
        "explanation_language": explanation_language,
        "model": model,
        "answer": answer,
        "phrase": match["phrase"],
        "meaning": match["meaning"],
        "usage": match["usage"],
        "curated": True,
        "provider_status": "curated",
    }


def _build_word_prompt(
    *,
    word: str,
    language_code: str,
    explanation_language: str,
) -> str:
    language_name = {
        "kn": "Kannada",
        "hi": "Hindi",
    }.get(language_code, language_code)
    return (
        "You are BhashaVaani, a concise language tutor. "
        f"Explain the English word or phrase '{word}' in {language_name}. "
        f"The learner cannot read {language_name} script yet. "
        f"Explain in {explanation_language}; if that is not suitable, use simple English. "
        f"Do not use {language_name} script anywhere except the Translated word line. "
        "Meaning, example meaning, and usage note must be readable without knowing the target script. "
        "Return plain text only, no Markdown. "
        "Use exactly these short lines: "
        "Translated word: target-language script plus roman transliteration in parentheses. "
        "Meaning: explanation in the learner explanation language. "
        "Say it like: romanized target-language pronunciation. "
        "Example: one target-language sentence using English alphabet transliteration, plus meaning in English and the explanation language when useful. "
        "Usage note: practical beginner usage in the explanation language."
    )


TARGET_SCRIPT_PATTERNS = {
    "kn": re.compile(r"[\u0c80-\u0cff]+"),
    "hi": re.compile(r"[\u0900-\u097f]+"),
}


def _sanitize_unreadable_target_script(answer: str, *, language_code: str) -> str:
    pattern = TARGET_SCRIPT_PATTERNS.get(language_code)
    if pattern is None:
        return answer

    first_line = answer.splitlines()[0] if answer.splitlines() else ""
    transliteration_match = re.search(r"\(([^)]+)\)", first_line)
    replacement = transliteration_match.group(1) if transliteration_match else ""

    cleaned_lines: list[str] = []
    for index, line in enumerate(answer.splitlines()):
        if index == 0 and line.lower().startswith("translated word:"):
            cleaned_lines.append(line)
            continue
        cleaned = pattern.sub(replacement, line)
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
        if cleaned:
            cleaned_lines.append(cleaned)

    return "\n".join(cleaned_lines).strip() or answer
