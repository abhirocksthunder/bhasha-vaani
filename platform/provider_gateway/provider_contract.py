from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class GenerationRequest:
    profile_id: str
    language_code: str
    prompt: str
    child_safe: bool


@dataclass(frozen=True)
class GenerationResponse:
    text: str
    provider: str
    model: str
    prompt_version: str


class LLMProvider(Protocol):
    async def generate(self, request: GenerationRequest) -> GenerationResponse:
        ...
