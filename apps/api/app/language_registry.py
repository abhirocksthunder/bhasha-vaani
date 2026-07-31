from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.validate_language_packs import (  # noqa: E402
    DEFAULT_LANGUAGE_PACKS_DIR,
    DEFAULT_SCHEMA_PATH,
    manifest_to_language_capability,
    validate_language_packs,
)


class LanguageRegistry:
    def __init__(
        self,
        language_packs_dir: Path = DEFAULT_LANGUAGE_PACKS_DIR,
        schema_path: Path = DEFAULT_SCHEMA_PATH,
    ) -> None:
        self.language_packs_dir = language_packs_dir
        self.schema_path = schema_path

    def list_languages(self) -> list[dict[str, Any]]:
        manifests = validate_language_packs(
            self.language_packs_dir,
            self.schema_path,
        )
        capabilities = [
            manifest_to_language_capability(manifest)
            for manifest in manifests
        ]
        return sorted(capabilities, key=lambda language: language["name"])
