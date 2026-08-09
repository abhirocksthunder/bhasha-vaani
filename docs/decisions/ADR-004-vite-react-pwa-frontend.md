# ADR-004: Vite/React PWA Frontend, Superseding Flutter-First

## Status

Accepted (supersedes ADR-001)

## Context

ADR-001 chose Flutter as the primary client so mobile (Android) and web could share one codebase, with Flutter Web deployed to Firebase Hosting for browser access.

In practice, the Flutter Web path introduced ongoing friction that outweighed that benefit for this project's actual usage:

- `flutter build web --wasm` is a full release build, taking noticeably longer than a normal dev server on every frontend change (see `CLAUDE.md`'s "Local Dev Refresh Workflow" and the resolved `BV-WASMBUILD-WHITESCREEN-001` issue it replaced).
- The debug dev server (`flutter run -d web-server`) that a faster loop would normally use had its own first-load white-screen race, which is what led to the slower wasm-build workflow in the first place.
- No native Android build has actually been produced or shipped from this codebase; the "Android from the same codebase" rationale in ADR-001 was a future option, not a realized benefit, at the time this decision was revisited.
- The app's actual surface area (a handful of tabbed screens: profiles, languages, a guided lesson, progress, a roadmap) does not need Flutter's cross-platform rendering engine to justify its build/dev-loop cost.

## Decision

Replace `apps/mobile_flutter` with `apps/web_pwa`, a Vite + React + TypeScript Progressive Web App, as the primary BhashaVaani client.

Scope is deliberately narrowed to **web-only**. The earlier "Android from the same codebase" goal is dropped, not preserved by other means -- no Capacitor/Trusted-Web-Activity wrapper is planned. If a native Android app is wanted later, that is a new decision to make at that time, informed by whichever web app exists then.

The backend (`apps/api`) is unchanged by this decision. It already exposes a plain REST API with CORS, so it is frontend-agnostic; both `apps/mobile_flutter` and `apps/web_pwa` called the same endpoints without any backend changes.

Audio (playback and recording on the lesson screen) uses the browser's native Web Speech API (`speechSynthesis` for text-to-speech, `SpeechRecognition`/`webkitSpeechRecognition` for speech-to-text) in `apps/web_pwa/src/core/voice/voiceService.ts`, in place of the `flutter_tts`/`speech_to_text` packages. This carries the same real-world caveat the Flutter version had: voice availability depends on the browser/OS, and speech recognition is reliably supported only in Chromium-based browsers today. This is not a regression introduced by the migration; it is the same limitation in a different package.

Installability and offline shell caching are provided by a small hand-written service worker (`apps/web_pwa/public/sw.js`) rather than `vite-plugin-pwa`/Workbox. That library's dependency tree (`workbox-build`, `terser`, etc.) repeatedly failed to install in the environment this migration was scaffolded in (see `.ai/known-issues.yaml`, `BV-WEBPWA-*` entries) due to a cross-OS mount issue unrelated to the package itself. A hand-written service worker is small enough to maintain directly and has no install-time dependency footprint. `vite-plugin-pwa` can still be adopted later if its extra features (precise precache manifests, update-prompt UX, etc.) turn out to be worth it.

## Migration Approach

The migration was executed side-by-side, not as a rip-and-replace:

- `apps/web_pwa` was built out in phases (scaffold; API client and app shell; lesson session with audio; progress dashboard and offline outbox; tutor pet and roadmap; PWA manifest/service worker) while `apps/mobile_flutter` kept running unmodified.
- `Start BhashaVaani.cmd` starts backend, Flutter (port 6002), and the Web PWA (port 6003) together during the transition, each in its own window (`scripts/start-web-pwa.ps1`), so both can be compared directly.
- `apps/mobile_flutter` is not deleted by this ADR. It remains in the repository as a reference and fallback until the Web PWA has been used enough in practice to be trusted as the sole frontend. Removing it is a separate, explicit decision -- see Known Issues.

## Consequences

- Frontend iteration is a normal Vite dev-server hot-reload loop instead of a multi-minute wasm rebuild per change.
- No native Android app can be produced from this codebase without a new decision and new work (Capacitor/TWA wrapper or a separate native project).
- `flutter_tts`/`speech_to_text`'s device-level integration is replaced by browser Web Speech APIs; behavior on non-Chromium browsers (Safari, Firefox) is weaker for speech recognition specifically, same caveat class as before, different specifics.
- Firebase Hosting deployment (referenced in ADR-001) would now deploy `apps/web_pwa`'s static build output instead of Flutter's; this has not been set up yet and needs its own pass (Firebase Auth, CORS hardening, secure tunnel -- unchanged from ADR-001/ADR-002's original remote-access requirements).
- Two frontends exist in the repository simultaneously for the duration of the migration, which is temporary maintenance overhead by design, traded for never being without a working app during the switch.
