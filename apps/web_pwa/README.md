# BhashaVaani Web PWA (Vite + React)

**Primary BhashaVaani frontend**, per `docs/decisions/ADR-004-vite-react-pwa-frontend.md`
(supersedes ADR-001's Flutter-first decision). Replaces `apps/mobile_flutter`,
which is kept running side-by-side as a legacy fallback rather than deleted
— see `.ai/known-issues.yaml` (`BV-WEBPWA-RETIRE-001`) for when/how that
gets retired.

## Status: feature-complete (all 7 migration phases done, 2026-08-02)

Done:
- Vite + React + TypeScript, dev server pinned to `127.0.0.1:6003` —
  deliberately NOT `6002`, which is still `apps/mobile_flutter`'s port
  (via `Start BhashaVaani.cmd`). Run both at once and tell them apart by
  port; `6002` is the legacy Flutter screens, `6003` is this app.
- API client talking to the same FastAPI backend on `127.0.0.1:6001` —
  unchanged, shared with Flutter, no backend changes anywhere in this
  migration.
- App shell: rail nav on wide viewports, bottom tabs on narrow ones, top
  bar with a build-version badge.
- Profiles tab, Languages tab: full parity (list/select/edit, capability
  badges, offline seed-data fallback).
- Lesson session tab: activity navigation (Next auto-completes before
  advancing, Previous, explicit Complete), Play phrase / Record answer via
  the browser's Web Speech API (`src/core/voice/voiceService.ts`),
  `Generate plan` with an Ollama model picker calling
  `/lesson-journey/generate`.
- Progress tab: summary tiles, learned-words history, `localStorage`-based
  offline progress outbox (parity with Flutter's `shared_preferences`
  outbox).
- Floating tutor pet (word lookup, language/provider/Ollama-model picker).
- Roadmap tab.
- Installable: `public/manifest.webmanifest` + a small hand-written
  `public/sw.js` (see ADR-004 for why not `vite-plugin-pwa`). The service
  worker only registers on production builds, never during `vite dev`.
- Catalog tab: human-in-the-loop growth of a language pack's starter
  catalog. Generates candidate phrases via a local Ollama model
  (`POST /catalog/{language}/generate-candidates`, writes nothing), lets
  you edit any field and check/uncheck each one, then only the approved
  ones get written (`POST /catalog/{language}/approve`). See
  `apps/api/app/catalog_generator.py` for why generation and writing are
  deliberately separate calls -- this is what lets a person catch a
  hallucinated or mangled native-script phrase before it becomes part of
  the trusted catalog that lesson generation draws from.

Not done / follow-ups:
- Not yet verified with a real `npm run dev` / `npm run build` on a normal
  machine (this was built in a sandboxed tool with a cross-OS mount that
  couldn't finish a full `vite build`, though `tsc -b` was clean and `vite
  build` transformed all modules without error each time — see
  `.ai/known-issues.yaml` `BV-WEBPWA-PARITY-001`).
- Firebase Hosting deployment for this app specifically hasn't been set up
  (Flutter's Firebase config doesn't carry over automatically).
- `vite-plugin-pwa` could replace the hand-written service worker later if
  its extra features turn out to be worth it (see ADR-004).

## Running locally

```powershell
cd apps/web_pwa
npm install
npm run dev      # http://127.0.0.1:6003, requires the backend running on 6001
npm run build    # type-checks (tsc -b) then builds to dist/
npm run preview  # serves the production build, also on 6003
```

`Start BhashaVaani.cmd` now starts all three: backend (6001), Flutter
(6002, via `scripts/start-frontend.ps1`), and this app (6003, via
`scripts/start-web-pwa.ps1`, which runs `npm install` automatically on
first launch if `node_modules` is missing) — each in its own window. CORS
in `apps/api/app/main.py` already allows both `127.0.0.1:6002` and
`127.0.0.1:6003`.

## Note on this repo's `D:\` mount

If you're developing on a machine where this repo lives on a
network/cross-OS mount, run `npm install` from a real local shell on that
machine rather than through a remote/sandboxed tool — bulk `node_modules`
installs and deletes were unreliable through such a mount when this was
scaffolded (slow renames, intermittent `EPERM`/`ENOTEMPTY` errors). Doesn't
affect a normal local `npm install`.
