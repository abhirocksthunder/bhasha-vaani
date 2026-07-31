from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434"
DEFAULT_OLLAMA_MODEL = "qwen3:30b"
CONFIG_PATH = Path(__file__).resolve().parents[3] / "platform" / "provider_gateway" / "provider_config.yaml"


class ProviderGatewayError(RuntimeError):
    pass


@dataclass(frozen=True)
class ProviderRoute:
    route: str
    base_url: str
    model: str


def resolve_provider_route(route: str | None) -> ProviderRoute:
    requested_route = (route or "local_ollama").strip() or "local_ollama"
    explicit_model = None
    if requested_route.startswith("ollama:"):
        explicit_model = requested_route.removeprefix("ollama:").strip()
        requested_route = "local_ollama"

    if requested_route != "local_ollama":
        raise ProviderGatewayError(f"{requested_route} is not enabled for local generation yet.")

    config = _read_ollama_config()
    base_url = os.environ.get("BHASHAVAANI_OLLAMA_URL", config.get("base_url", DEFAULT_OLLAMA_URL))
    preferred_model = os.environ.get("BHASHAVAANI_OLLAMA_MODEL", config.get("model", DEFAULT_OLLAMA_MODEL))
    models = list_ollama_models(base_url)
    selected_model = explicit_model or _select_available_ollama_model_from(models, preferred_model)
    if selected_model not in [model["name"] for model in models]:
        raise ProviderGatewayError(f"{selected_model} is not installed in Ollama.")
    return ProviderRoute(route="local_ollama", base_url=base_url.rstrip("/"), model=selected_model)


def list_local_ollama_models() -> dict[str, Any]:
    config = _read_ollama_config()
    base_url = os.environ.get("BHASHAVAANI_OLLAMA_URL", config.get("base_url", DEFAULT_OLLAMA_URL))
    preferred_model = os.environ.get("BHASHAVAANI_OLLAMA_MODEL", config.get("model", DEFAULT_OLLAMA_MODEL))
    models = list_ollama_models(base_url)
    selected_model = _select_available_ollama_model_from(models, preferred_model) if models else None
    return {
        "provider": "local_ollama",
        "base_url": base_url,
        "configured_model": preferred_model,
        "selected_model": selected_model,
        "models": models,
    }


def generate_with_ollama(
    *,
    prompt: str,
    route: str | None = None,
    timeout_seconds: int = 45,
) -> dict[str, Any]:
    provider = resolve_provider_route(route)
    body = json.dumps(
        {
            "model": provider.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "num_ctx": 2048,
                "num_predict": 350,
            },
        },
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{provider.base_url}/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace").strip()
        message = f"HTTP {error.code}"
        if detail:
            message = f"{message}: {detail}"
        raise ProviderGatewayError(f"{provider.model} via Ollama failed with {message}") from error
    except (TimeoutError, urllib.error.URLError, json.JSONDecodeError) as error:
        raise ProviderGatewayError(f"{provider.model} via Ollama failed: {error}") from error

    answer = str(payload.get("response", "")).strip()
    if not answer:
        raise ProviderGatewayError("Ollama returned an empty response.")

    return {
        "answer": answer,
        "route": provider.route,
        "model": provider.model,
    }


def list_ollama_models(base_url: str) -> list[dict[str, Any]]:
    try:
        request = urllib.request.Request(f"{base_url.rstrip('/')}/api/tags", method="GET")
        with urllib.request.urlopen(request, timeout=5) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (TimeoutError, urllib.error.URLError, json.JSONDecodeError) as error:
        raise ProviderGatewayError(str(error)) from error

    return [
        {
            "name": str(model.get("name", "")).strip(),
            "parameter_size": model.get("details", {}).get("parameter_size", ""),
            "family": model.get("details", {}).get("family", ""),
            "capabilities": model.get("capabilities", []),
        }
        for model in payload.get("models", [])
        if str(model.get("name", "")).strip()
    ]


def _select_available_ollama_model_from(models: list[dict[str, Any]], preferred_model: str) -> str:
    names = [model["name"] for model in models]
    if not names:
        raise ProviderGatewayError("No Ollama models are installed.")
    if preferred_model in names:
        return preferred_model
    for preferred_prefix in ("ornith:9b", "gemma", "deepseek"):
        for name in names:
            if name.startswith(preferred_prefix):
                return name
    for name in names:
        normalized = name.lower()
        if "coder" not in normalized and "vl" not in normalized:
            return name
    return names[0]


def _read_ollama_config() -> dict[str, str]:
    if not CONFIG_PATH.exists():
        return {"base_url": DEFAULT_OLLAMA_URL, "model": DEFAULT_OLLAMA_MODEL}

    values: dict[str, str] = {}
    in_ollama_block = False
    for line in CONFIG_PATH.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if line.startswith("  ") and not line.startswith("    ") and stripped.endswith(":"):
            if stripped == "local_ollama:":
                in_ollama_block = True
                continue
            if in_ollama_block:
                break

        if stripped == "local_ollama:":
            in_ollama_block = True
            continue
        if in_ollama_block and stripped and not line.startswith(" "):
            break
        if in_ollama_block and line.startswith("    ") and ":" in stripped:
            key, value = stripped.split(":", 1)
            values[key.strip()] = value.strip()

    return {
        "base_url": values.get("base_url", DEFAULT_OLLAMA_URL),
        "model": values.get("model", DEFAULT_OLLAMA_MODEL),
    }
