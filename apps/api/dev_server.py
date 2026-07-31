from __future__ import annotations

import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from app.language_registry import LanguageRegistry
from app.lesson_journey import recommend_lesson_journey
from app.provider_gateway import list_local_ollama_models
from app.progress_event import ProgressEventValidationError
from app.storage import BhashaVaaniStore
from app.word_assistant import explain_word

STORE: BhashaVaaniStore | None = None
LANGUAGE_REGISTRY = LanguageRegistry()


class BhashaVaaniDevHandler(BaseHTTPRequestHandler):
    server_version = "BhashaVaaniDev/0.1"

    def do_OPTIONS(self) -> None:
        self._send_empty(204)

    def do_GET(self) -> None:
        if self.path == "/":
            self._send_json(
                {
                    "name": "BhashaVaani dev API",
                    "status": "ok",
                    "endpoints": [
                        "/health",
                        "/profiles",
                        "/languages",
                        "/learning-sessions",
                        "/progress/events",
                        "/assistant/word",
                        "/providers/ollama/models",
                        "/lesson-journey",
                        "/profiles/{profile_id}/progress",
                    ],
                },
            )
            return

        if self.path == "/health":
            self._send_json({"status": "ok"})
            return

        if self.path == "/languages":
            self._send_json(LANGUAGE_REGISTRY.list_languages())
            return

        if self.path == "/profiles":
            self._send_json(get_store().list_profiles())
            return

        if self.path == "/providers/ollama/models":
            self._send_json(list_local_ollama_models())
            return

        if self.path.startswith("/profiles/") and self.path.endswith("/progress"):
            profile_id = self.path.split("/")[2]
            self._send_json(get_store().progress_summary(profile_id))
            return

        self._send_json({"error": "not_found", "path": self.path}, status=404)

    def do_POST(self) -> None:
        if self.path == "/profiles":
            profile = self._read_json_body()
            self._send_json(get_store().create_profile(profile), status=201)
            return

        if self.path == "/learning-sessions":
            payload = self._read_json_body()
            self._send_json(get_store().create_learning_session(payload), status=201)
            return

        if self.path == "/progress/events":
            event = self._read_json_body()
            try:
                result = get_store().record_progress_event(event)
            except ProgressEventValidationError as error:
                self._send_json(
                    {"error": str(error)},
                    status=400,
                )
                return

            self._send_json(result, status=201)
            return

        if self.path == "/assistant/word":
            payload = self._read_json_body()
            self._send_json(explain_word(payload))
            return

        if self.path == "/lesson-journey":
            payload = self._read_json_body()
            profile_id = str(payload.get("profile_id", "profile_abhilash"))
            self._send_json(
                recommend_lesson_journey(payload, get_store().progress_summary(profile_id)),
            )
            return

        self._send_json({"error": "not_found", "path": self.path}, status=404)

    def log_message(self, format: str, *args: Any) -> None:
        print(f"{self.address_string()} - {format % args}")

    def _send_empty(self, status: int) -> None:
        self.send_response(status)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, payload: Any, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_cors_headers(self) -> None:
        allowed_origins = {
            "http://127.0.0.1:6002",
            "http://localhost:6002",
        }
        origin = self.headers.get("Origin")
        allowed_origin = origin if origin in allowed_origins else "http://127.0.0.1:6002"
        self.send_header("Access-Control-Allow-Origin", allowed_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _read_json_body(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length == 0:
            return {}

        body = self.rfile.read(content_length)
        return json.loads(body.decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Run BhashaVaani local dev API.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=6001, type=int)
    parser.add_argument("--db-path", default=None)
    args = parser.parse_args()

    global STORE
    STORE = BhashaVaaniStore(
        Path(args.db_path) if args.db_path is not None else None,
    )

    server = ThreadingHTTPServer((args.host, args.port), BhashaVaaniDevHandler)
    print(f"BhashaVaani dev API listening on http://{args.host}:{args.port}")
    server.serve_forever()


def get_store() -> BhashaVaaniStore:
    global STORE
    if STORE is None:
        STORE = BhashaVaaniStore()
    return STORE


if __name__ == "__main__":
    main()
