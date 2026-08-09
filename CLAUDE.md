# CLAUDE.md

This file gives Claude or any other coding agent a compact but complete working understanding of the BhashaVaani repository.

## Project Summary

BhashaVaani is a family language-learning platform. It is local-AI first, mobile-first, and designed so Flutter Web, Android, Alexa, AI OS, and future clients can share learner profiles, language packs, tutoring logic, progress, and local model provider routing.

The current product direction is:

- **apps/web_pwa (Vite + React + TypeScript) is the primary client**, per
  ADR-004, which supersedes the earlier Flutter-first decision (ADR-001).
  apps/mobile_flutter is still in the repository and still runs -- it has
  not been deleted -- but new frontend work should go into apps/web_pwa
  unless a task specifically concerns the legacy Flutter app.
- The Web PWA can later be deployed to Firebase Hosting (or any static
  host) for access anywhere.
- The backend runs on this PC first.
- Remote access should use a secure tunnel plus authentication before it is treated as production-like.
- Local models are the default. Frontier models must remain optional and swappable.
- Server state is authoritative.
- Progress is append-only and event-sourced.
- Clients can queue progress events offline.

## Current Runtime

Local development uses:

- Backend: `http://127.0.0.1:6001`
- Frontend (Web PWA, primary, per ADR-004): `http://127.0.0.1:6003`
- Frontend (Flutter, legacy, still running side-by-side): `http://127.0.0.1:6002`

Do not use port `6000` for a frontend; Chromium blocks it as an unsafe port.

Start backend + both frontends with:

```bat
Start BhashaVaani.cmd
```

That launcher:

1. Stops old processes on ports `6001`, `6002`, and `6003`.
2. Starts the FastAPI backend (with `--reload`).
3. Builds a WebAssembly release bundle of Flutter Web (`flutter build web
   --wasm`) and serves it as static files on port `6002`. This replaced an
   earlier debug `flutter run -d web-server` setup that had a first-load
   white-screen race: the browser could open before the debug dev server
   had finished compiling.
4. Starts the Web PWA's Vite dev server on port `6003`
   (`scripts/start-web-pwa.ps1`), running `npm install` automatically on
   first launch if `apps/web_pwa/node_modules` is missing.
5. Waits (polling, not a fixed timer) until the Flutter frontend actually
   responds, then opens `http://127.0.0.1:6002`. First launch takes longer
   than before because it is doing a full release build, not starting a
   dev server. (The Web PWA window isn't waited on the same way yet --
   check its own window for "ready", then open `6003` yourself.)

Supporting scripts:

- `scripts/stop-dev-ports.ps1`
- `scripts/start-backend.ps1`
- `scripts/start-frontend.ps1` — builds `flutter build web --wasm` then
  serves `apps/mobile_flutter/build/web` with a plain Python static server.
  Legacy; see ADR-004.
- `scripts/start-web-pwa.ps1` — runs `npm install` (if needed) then
  `npm run dev` for `apps/web_pwa`, on port `6003`.
- `scripts/wait-for-frontend.ps1` — polls the Flutter frontend URL and only
  opens the browser once it responds.

## Repository Map

```text
apps/web_pwa               Primary Vite/React PWA client (ADR-004)
apps/mobile_flutter        Legacy Flutter client, still running side-by-side (see ADR-004)
apps/api                  Local FastAPI backend and tests
domains/progress          Append-only progress event domain notes
domains/tutoring          Tutoring domain notes
platform/provider_gateway Local/frontier AI provider abstraction
platform/family_profiles  Family profile rules placeholder
platform/language_registry Language capability discovery notes
language_packs            Language manifests and starter curriculum catalogs
docs                      Architecture, contracts, ADRs, product docs
.ai                       Agent-readable current state, changelog, issues, handoffs
```

Important docs:

- `.ai/current-state.yaml`
- `.ai/project-map.yaml`
- `.ai/change-log.yaml`
- `.ai/known-issues.yaml`
- `docs/architecture/overview.md`
- `docs/decisions/ADR-001-flutter-first-firebase-web.md` (superseded by ADR-004)
- `docs/decisions/ADR-002-local-backend-provider-gateway.md`
- `docs/decisions/ADR-003-adaptive-lesson-generation.md`
- `docs/decisions/ADR-004-vite-react-pwa-frontend.md`
- `apps/web_pwa/README.md`
- `docs/contracts/progress-event-envelope.md`
- `docs/contracts/language-pack-manifest.md`

## Architecture Rules

Follow these unless the user explicitly asks for an architectural change and an ADR is updated.

- apps/web_pwa (Vite + React + TypeScript) is the primary client (ADR-004, supersedes ADR-001). apps/mobile_flutter is legacy and still running side-by-side; do not build new features there unless specifically asked to.
- Backend APIs own server state.
- Clients do not write mastery scores directly.
- Progress events are append-only.
- AI providers must be accessed through provider gateways.
- Local providers are default.
- Frontier providers are optional and must be swappable.
- Language-specific behavior belongs in language packs.
- The tutoring engine must not contain language-specific branches such as `if language == "kn"`.
- LLM outputs must be validated before persistence.
- Child profiles require constrained content generation.
- Domain modules must not depend directly on client applications.

## Implemented Capabilities

Backend:

- FastAPI app with CORS for Flutter Web.
- Health endpoint.
- Profile list/create/update-like upsert.
- Language registry from validated manifests.
- Learning session endpoint.
- Progress event persistence in SQLite.
- Progress summary projection.
- Typed progress event validation.
- Progress schema version guard.
- Tutor pet word assistant endpoint.
- Ollama local model listing endpoint.
- Lesson journey endpoint.
- Lesson plan persistence tables.
- Protected two-model lesson generation endpoint.

Web PWA (apps/web_pwa, primary, ADR-004) — full feature parity with the Flutter app below, ported to React/TypeScript:

- Glossy UI shell (rail nav ≥900px, bottom tabs below that), build-version badge.
- Profile selection and profile edit modal.
- Language selection.
- Guided lesson screen: Next/Previous/Complete navigation (Next auto-completes, same fix as Flutter's BV-NEXT-NOSAVE-001/BV-NEXT-STUCK-001 lineage, ported proactively), Play phrase/Record answer via the browser's Web Speech API, `Generate plan` action with an Ollama model picker.
- Progress dashboard with learned-words history.
- Offline fallback states.
- Durable progress outbox using `localStorage` (parity with Flutter's `shared_preferences` outbox).
- Floating tutor pet (word assistant, provider/model picker).
- Roadmap tab.
- Minimal hand-written service worker (`apps/web_pwa/public/sw.js`) + web app manifest for installability; not `vite-plugin-pwa`, see ADR-004.
- Not yet done: Firebase Hosting deployment for this app specifically (Flutter's Firebase setup does not carry over automatically).

Flutter (apps/mobile_flutter, legacy, still running side-by-side per ADR-004):

- Mobile-first glossy UI shell.
- Profile selection and profile edit bottom sheet.
- Language selection.
- Guided lesson screen.
- Progress dashboard.
- Offline fallback states.
- Durable progress outbox using `shared_preferences`.
- Floating tutor pet.
- Tutor pet can ask words by selected language/provider/model.
- Tutor pet shows installed Ollama model tags.
- Lesson screen has a `Generate plan` action.

Language packs:

- Kannada manifest, full status.
- Kannada starter curriculum catalog with 12 activities.
- Hindi manifest, preview status.
- Hindi starter curriculum catalog.
- JSON schema for manifests.
- Dependency-free language pack validator.

## Current Known Issues

1. Local Ollama models do not yet reliably return valid reviewed JSON for lesson generation.

   The endpoint `/lesson-journey/generate` exists and validates output before persistence, but tested model combinations have returned malformed or empty JSON. The backend correctly rejects unsafe output instead of saving bad lesson plans.

2. Firebase-hosted web access is not production-ready yet.

   It will need Firebase Auth, safe CORS, and a secure HTTPS tunnel to the local backend.

3. Offline progress queue exists, but retry controls are still basic.

## AI Provider Gateway

Provider config is at:

```text
platform/provider_gateway/provider_config.yaml
```

The backend currently supports local Ollama for generation.

Useful endpoints:

```text
GET  /providers/ollama/models
POST /assistant/word
POST /lesson-journey/generate
```

Model route format:

```text
local_ollama
ollama:<model-name>
```

Example:

```json
{
  "word": "air",
  "language_code": "kn",
  "explanation_language": "English",
  "model": "ollama:ornith:9b"
}
```

The tutor pet sends the profile explanation language so learners who cannot read Kannada/Hindi script still get readable transliteration and explanation.

## Lesson System

The lesson journey has two layers.

1. Language-pack starter catalogs

   These are deterministic and trusted.

   ```text
   language_packs/kn/curriculum/starter.json
   language_packs/hi/curriculum/starter.json
   ```

   Kannada currently has 12 starter activities. Growing this catalog is a
   human-in-the-loop process, not automatic: apps/web_pwa's Catalog tab
   (and the equivalent `tools/generate_catalog_phrases.py` CLI) can draft
   candidate new phrases with a local Ollama model via
   `POST /catalog/{language}/generate-candidates` (writes nothing), but a
   person must review/edit and explicitly approve each one via
   `POST /catalog/{language}/approve` before it's written to
   `starter.json`. See `apps/api/app/catalog_generator.py`.

2. Adaptive generated plans

   Generated plans are persisted in SQLite tables:

   - `lesson_plans`
   - `lesson_items`

   Generation flow:

   ```text
   profile + progress + language catalog
     -> tutor model drafts JSON
     -> reviewer model validates/repairs JSON
     -> backend validates final structure
     -> backend tops up with not-yet-learned catalog items if the model
        under-selected them
     -> backend persists active plan
     -> client loads persisted plan
   ```

   `generate_lesson_plan` also accepts an optional `request_text` field --
   a free-form "teach me X" request (e.g. "5 new words today", "review
   what we did"), parsed by `apps/api/app/lesson_request.py` into
   `target_count`/`mode` hints (explicit payload fields always win). This
   is the Web PWA lesson screen's "Teach me... (optional)" box.

Bad or malformed model output must be rejected before persistence.

## Progress Model

Progress events are append-only and validated by `apps/api/app/progress_event.py`.

Current event path:

```text
POST /progress/events
GET  /profiles/{profile_id}/progress
```

Flutter builds `activity_completed` events and queues failed uploads locally.

Clients may cache/queue, but server state remains authoritative.

## Validation Commands

Backend tests:

```powershell
cd apps/api
.\.api-venv\Scripts\python.exe -m unittest discover -s tests
```

Language pack validation:

```powershell
apps\api\.api-venv\Scripts\python.exe tools\validate_language_packs.py
```

Web PWA (primary, ADR-004):

```powershell
cd apps/web_pwa
npx tsc -b --noEmit
npm run build
```

Flutter (legacy, still runs, see ADR-004):

```powershell
cd apps/mobile_flutter
flutter analyze --no-pub
flutter test
flutter build web --wasm --base-href /
```

On this machine, plain `python` may be misconfigured. Prefer the API venv Python shown above.

Flutter commands may need normal SDK/cache access outside the repo.

## Development Workflow For Agents

Before editing code, read:

1. `.ai/current-state.yaml`
2. `.ai/project-map.yaml`
3. The relevant domain README or architecture doc
4. Related ADRs under `docs/decisions/`

Before completing a task:

1. Run relevant tests or explain why not.
2. Update `.ai/current-state.yaml`.
3. Update `.ai/change-log.yaml`.
4. Update `.ai/known-issues.yaml` if risks changed.
5. Add/update ADR if architecture changed.
6. Add a handoff under `.ai/handoffs/`.
7. If any file under `apps/mobile_flutter` changed, bump `version`, `updatedAt`,
   and `summary` in `apps/mobile_flutter/lib/core/config/build_info.dart`.
   This badge is shown in the app's top bar so a hard refresh (or forgetting
   to restart the `flutter run` dev server) is visible immediately instead
   of silently serving stale code.
8. If any file under `apps/web_pwa` changed, bump `version`, `updatedAt`,
   and `summary` in `apps/web_pwa/src/core/config/buildInfo.ts` -- same
   purpose as the Flutter badge above, shown in the Web PWA's top bar.

## Local Dev Refresh Workflow

The backend (`scripts/start-backend.ps1`) runs `uvicorn --reload`, so Python
changes under `apps/api/app` apply automatically without restarting it.

The frontend (`scripts/start-frontend.ps1`) runs `flutter build web --wasm`
and then serves the built `build/web` folder as static files. It does
**not** auto-rebuild in the background the way the backend does. A browser
hard refresh alone will keep serving whatever was last built. After a
Flutter/Dart change:

1. Stop and rerun `Start BhashaVaani.cmd` (or just the frontend script) so
   `flutter build web --wasm` runs again. This takes noticeably longer than
   the old debug dev server did (it is a full release build), so give it a
   minute or two — `scripts/wait-for-frontend.ps1` polls and only opens the
   browser once the new build is actually being served, rather than
   guessing with a fixed timer (the old fixed-timer approach is what caused
   the first-load white-screen issue this replaced).
2. Hard refresh the browser tab.
3. Check the `v0.x.x` badge next to the "BhashaVaani" title in the top bar
   (hover it for the update timestamp and a one-line summary of the last
   change) — if it still shows the old version, the dev server has not
   picked up the change yet.

## Near-Term Roadmap

Recommended next steps:

1. Make local-model lesson JSON reliable.

   Add model-specific presets, stricter prompts, JSON repair constrained by language-pack catalogs, and better diagnostics for Ollama failures.

2. Improve generated plan quality.

   Add validation beyond structure:

   - phrase/meaning pair must come from catalog or pass a language-pack validator
   - no unreadable script where transliteration is required
   - child-safe content checks
   - mobile text length limits

3. Expand language-pack curriculum.

   Add more Kannada and Hindi starter catalog items before relying heavily on generation.
   `tools/generate_catalog_phrases.py` can draft new candidate phrases via a
   local Ollama model (`--dry-run` first); it only validates structure
   (non-empty fields, no duplicates), not linguistic correctness, so
   generated native-script text should be spot-checked before being trusted
   like the rest of the hand-authored catalog.

4. Add richer journey logic.

   Use progress events to pick review items, weak phrases, spaced repetition, and next difficulty.

5. Prepare remote Web PWA access.

   Add Firebase Auth (or equivalent), CORS hardening, backend token verification, and secure tunnel documentation, for apps/web_pwa (the primary client as of ADR-004). apps/mobile_flutter's Firebase Hosting setup does not carry over automatically.

6. Decide when to retire apps/mobile_flutter.

   ADR-004 kept it running side-by-side deliberately. Once apps/web_pwa has been used enough in practice to be trusted as the sole frontend, archive/remove apps/mobile_flutter and drop it from Start BhashaVaani.cmd -- a separate explicit decision, not automatic.

## Important Current Status

The app is usable locally, in both frontends. apps/web_pwa (primary, port 6003) and apps/mobile_flutter (legacy, port 6002) both talk to the same backend and should be at feature parity as of the ADR-004 migration; the lesson screen in either should show 12 Kannada starter activities from the language pack catalog when no valid generated plan is active.

The `Generate plan` button is wired in both frontends, but local model generation may reject output until JSON reliability is improved (see known issue `BV-LESSON-GEN-001`). This is intentional: never persist bad tutoring content just because a model produced it.
