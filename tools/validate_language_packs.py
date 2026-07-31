from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LANGUAGE_PACKS_DIR = REPO_ROOT / "language_packs"
DEFAULT_SCHEMA_PATH = DEFAULT_LANGUAGE_PACKS_DIR / "schema" / "manifest.schema.json"


@dataclass(frozen=True)
class ValidationIssue:
    path: str
    message: str


class LanguagePackValidationError(Exception):
    def __init__(self, issues: list[ValidationIssue]) -> None:
        self.issues = issues
        super().__init__("\n".join(f"{issue.path}: {issue.message}" for issue in issues))


def validate_language_packs(
    language_packs_dir: Path = DEFAULT_LANGUAGE_PACKS_DIR,
    schema_path: Path = DEFAULT_SCHEMA_PATH,
) -> list[dict[str, Any]]:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    if (language_packs_dir / "manifest.yaml").exists():
        manifests = [language_packs_dir / "manifest.yaml"]
    else:
        manifests = sorted(language_packs_dir.glob("*/manifest.yaml"))
    manifests = [
        manifest
        for manifest in manifests
        if manifest.parent.name != "schema"
    ]
    issues: list[ValidationIssue] = []
    parsed_manifests: list[dict[str, Any]] = []

    if not manifests:
        issues.append(ValidationIssue(str(language_packs_dir), "no manifest.yaml files found"))

    for manifest_path in manifests:
        try:
            manifest = parse_simple_yaml(manifest_path.read_text(encoding="utf-8"))
            validate_object(manifest, schema, manifest_path.name)
            language_code = manifest["language"]["code"]
            if language_code != manifest_path.parent.name:
                issues.append(
                    ValidationIssue(
                        str(manifest_path),
                        f"language.code '{language_code}' must match folder name '{manifest_path.parent.name}'",
                    ),
                )
            parsed_manifests.append(manifest)
        except LanguagePackValidationError as error:
            issues.extend(
                ValidationIssue(f"{manifest_path}:{issue.path}", issue.message)
                for issue in error.issues
            )
        except Exception as error:
            issues.append(ValidationIssue(str(manifest_path), str(error)))

    if issues:
        raise LanguagePackValidationError(issues)

    return parsed_manifests


def manifest_to_language_capability(manifest: dict[str, Any]) -> dict[str, Any]:
    support = manifest["support"]
    language = manifest["language"]

    return {
        "code": language["code"],
        "name": language["name"],
        "native_name": language["native_name"],
        "status": manifest["status"],
        "transliteration": support["transliteration"],
        "speech_to_text": support["speech_to_text"],
        "text_to_speech": support["text_to_speech"],
        "pronunciation": support["pronunciation_assessment"],
    }


def parse_simple_yaml(text: str) -> dict[str, Any]:
    root: dict[str, Any] = {}
    stack: list[tuple[int, Any]] = [(-1, root)]
    pending_key: tuple[int, dict[str, Any], str] | None = None

    for raw_line in text.splitlines():
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue

        indent = len(raw_line) - len(raw_line.lstrip(" "))
        stripped = raw_line.strip()

        while stack and indent <= stack[-1][0]:
            stack.pop()

        if stripped.startswith("- "):
            if pending_key is None:
                raise ValueError(f"list item without parent: {stripped}")
            pending_indent, parent, key = pending_key
            if indent <= pending_indent:
                raise ValueError(f"list item has invalid indentation: {stripped}")
            current = parent.get(key)
            if current is None or current == {}:
                current = []
                parent[key] = current
                stack.append((indent, current))
            if not isinstance(current, list):
                raise ValueError(f"{key} is not a list")
            current.append(parse_scalar(stripped[2:].strip()))
            continue

        key, separator, value = stripped.partition(":")
        if not separator:
            raise ValueError(f"expected key: value line, got: {stripped}")

        current_parent = stack[-1][1]
        if not isinstance(current_parent, dict):
            raise ValueError(f"cannot assign key under list: {stripped}")

        if value.strip() == "":
            child: dict[str, Any] = {}
            current_parent[key] = child
            pending_key = (indent, current_parent, key)
            stack.append((indent, child))
        else:
            current_parent[key] = parse_scalar(value.strip())
            pending_key = None

    return root


def parse_scalar(value: str) -> Any:
    if value == "true":
        return True
    if value == "false":
        return False
    if value == "null":
        return None
    if value.startswith('"') and value.endswith('"'):
        return value[1:-1]
    if value.startswith("'") and value.endswith("'"):
        return value[1:-1]
    return value


def validate_object(value: Any, schema: dict[str, Any], path: str) -> None:
    issues: list[ValidationIssue] = []
    _validate(value, schema, path, issues)
    if issues:
        raise LanguagePackValidationError(issues)


def _validate(
    value: Any,
    schema: dict[str, Any],
    path: str,
    issues: list[ValidationIssue],
) -> None:
    expected_type = schema.get("type")
    if expected_type and not _matches_type(value, expected_type):
        issues.append(ValidationIssue(path, f"expected {expected_type}, got {type(value).__name__}"))
        return

    if expected_type == "object":
        required = schema.get("required", [])
        for key in required:
            if key not in value:
                issues.append(ValidationIssue(f"{path}.{key}", "missing required field"))

        for key, child_schema in schema.get("properties", {}).items():
            if key in value:
                _validate(value[key], child_schema, f"{path}.{key}", issues)

    if expected_type == "array":
        min_items = schema.get("minItems")
        if min_items is not None and len(value) < min_items:
            issues.append(ValidationIssue(path, f"requires at least {min_items} item(s)"))
        item_schema = schema.get("items")
        if item_schema:
            for index, item in enumerate(value):
                _validate(item, item_schema, f"{path}[{index}]", issues)

    enum_values = schema.get("enum")
    if enum_values is not None and value not in enum_values:
        issues.append(ValidationIssue(path, f"must be one of {enum_values}"))

    pattern = schema.get("pattern")
    if pattern and isinstance(value, str) and re.fullmatch(pattern, value) is None:
        issues.append(ValidationIssue(path, f"must match pattern {pattern}"))

    min_length = schema.get("minLength")
    if min_length is not None and isinstance(value, str) and len(value) < min_length:
        issues.append(ValidationIssue(path, f"must have length >= {min_length}"))


def _matches_type(value: Any, expected_type: str) -> bool:
    if expected_type == "object":
        return isinstance(value, dict)
    if expected_type == "array":
        return isinstance(value, list)
    if expected_type == "string":
        return isinstance(value, str)
    if expected_type == "boolean":
        return isinstance(value, bool)
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate BhashaVaani language packs.")
    parser.add_argument("--language-packs-dir", type=Path, default=DEFAULT_LANGUAGE_PACKS_DIR)
    parser.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA_PATH)
    args = parser.parse_args()

    manifests = validate_language_packs(args.language_packs_dir, args.schema)
    capabilities = [manifest_to_language_capability(manifest) for manifest in manifests]
    print(json.dumps({"valid": True, "languages": capabilities}, indent=2))


if __name__ == "__main__":
    main()
