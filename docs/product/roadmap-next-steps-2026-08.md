# BhashaVaani — Next Steps Roadmap (as of 2026-08-02)

Synthesizes `.ai/known-issues.yaml`, `.ai/current-state.yaml`, and
`docs/product/roadmap-learning-features.md` into one sequenced plan. Update
all four together when priorities shift (see `CLAUDE.md` workflow).

Goal: a reliable, local-AI-first family language tutor — usable today on the
Web PWA, growing its own curriculum safely, and eventually able to run
free-form lessons, two-bot practice conversations, and a consistent-voice
tutor that listens and talks back.

---

## Phase 0 — Verify what was just built (do first, low effort)

Nothing here is new code; it's closing the loop on the web_pwa migration and
Catalog builder before building further on top of them.

1. Run `npm install` + `npm run dev` / `npm run build` for `apps/web_pwa` on
   your actual Windows machine — the sandbox could only verify `tsc -b` and
   `vite build`'s transform step (`BV-WEBPWA-PARITY-001`).
2. Confirm `Generate plan` produces a real lesson end-to-end from the Web
   PWA using `gemma4:latest`.
3. Try the new Catalog tab once: generate a batch of candidate phrases,
   review/edit, approve a few, confirm they land in `starter.json` and show
   up in the next generated lesson.

---

## Phase 1 — Close out lesson-generation reliability (Stage 1.1)

Everything downstream (bigger catalogs, scenarios, voice tutor) depends on
generation being trustworthy, so this stays first.

- Acceptance target: 5 consecutive `/lesson-journey/generate` calls against
  the same profile succeed with no manual retry, using `gemma4:latest`.
- If failures resume, capture the `diagnostics` field from the rejection
  response — that's what tells us whether it's truncation, malformed JSON,
  or another empty-response case like `BV-LESSON-GEN-002`.
- Once stable, mark `BV-LESSON-GEN-001` resolved in `known-issues.yaml`.

## Phase 2 — Grow the curriculum using the new Catalog tool

`BV-REPEAT-CATALOG-001` is a content-size problem, not a bug — 12 Kannada
phrases run out fast. The tool to fix it now exists; this phase is about
using it.

- Spend a few sessions generating + approving candidates for Kannada until
  the catalog is meaningfully larger (aim: 40-60+ activities before it stops
  feeling repetitive).
- Do the same for Hindi to bring it past "preview" status.
- Spot-check native-script accuracy on anything approved — the tool only
  checks structure, not linguistic correctness.

## Phase 3 — Progress-aware selection, properly (Stage 1.2 → 1.4)

- Add a per-item mastery/strength signal to `activity_completed` events (or
  a derived projection) so regeneration can prioritize weak items, not just
  "not yet seen" — this was scoped but not fully built.
- Ship the "teach me X" free-form launcher (Stage 1.3): map phrasings like
  "teach me Kannada", "continue where I left off", "5 new words today" to
  correctly-scoped generation requests.
- Add a session recap screen referencing prior sessions, not just the
  current one (Stage 1.4).

## Phase 4 — Two-bot scenario conversation studio (Stage 2)

Planned, not started. Sequenced after Stage 1 because it reuses the same
two-model draft/review pattern and needs generation to already be reliable.

- `POST /scenarios` + versioned turn-based conversation contract.
- Director/actor dialogue generation with the same "reject bad output"
  discipline as lesson generation.
- Multi-voice TTS provider (two distinct voices) added to the provider
  gateway.
- New Scenario Studio screen in `apps/web_pwa` with synced transcript
  playback.
- Persist generated conversations per profile so they can be replayed.

## Phase 5 — Personalized voice tutor (Stage 3)

Planned. Directly reuses Stage 2's TTS voice pipeline, so doing Stage 2
first avoids rebuilding voice infra twice.

- STT provider in the gateway for the learner's comfortable language.
- Persistent `voice_id` per profile so the tutor always sounds the same,
  regardless of which text model generated the reply.
- Bilingual turn-taking loop (speak comfortable language → tutor replies in
  target language → same voice every time).
- Push-to-talk wired into the lesson/tutor pet UI (replaces the current
  Web Speech API stopgap, `BV-VOICE-STOPGAP-001`).

## Phase 6 — Platform housekeeping (can run anytime, low urgency)

Not blocking, do opportunistically:

- Decide when to retire `apps/mobile_flutter` now that `apps/web_pwa` has
  full parity (`BV-WEBPWA-RETIRE-001`) — an explicit call for you to make,
  not automatic.
- Consider `vite-plugin-pwa` if the hand-written service worker ever feels
  insufficient (richer precache/update-prompt UX).
- Prepare remote access: Firebase Auth (or equivalent), CORS hardening,
  secure tunnel to the local backend (`BV-DEPLOY-001`) — needed before the
  Web PWA is usable from outside this machine.

---

## Sequencing at a glance

```text
Phase 0  Verify web_pwa + Catalog tool on real machine     (do first)
   |
   v
Phase 1  Harden lesson generation (5/5 reliable)            <- blocks 2-5
   |
   v
Phase 2  Grow Kannada/Hindi catalogs via human-in-the-loop
   |
   v
Phase 3  Real progress-aware selection + "teach me X"
   |
   v
Phase 4  Two-bot scenario studio                            <- shares TTS
   |                                                             with Phase 5
   v
Phase 5  Personalized voice tutor (STT + consistent voice)

Phase 6  Housekeeping (retire Flutter, remote access) -- parallel, anytime
```

Phase 1 is the highest-leverage step: it fixes the reliability problem that
every later phase would otherwise inherit.
