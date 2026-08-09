# Roadmap: History-Aware Lessons, Bot-to-Bot Conversations, Personalized Voice Tutor

This roadmap sequences the three capabilities Abhilash asked for first, on top of
what BhashaVaani already has (Kannada/Hindi language packs, append-only progress
events, the two-model lesson generation endpoint, and the provider gateway). It
does not replace `docs/product/vision.md` or the ADRs — it schedules work inside
that architecture.

Status values: `completed`, `in_progress`, `planned`. This file is the
human-readable source; the Flutter **Roadmap** tab renders the same stages for
at-a-glance tracking. Update both when a stage's status changes.

## Stage 0 — Foundation already in place

Status: **completed**

- Kannada (full) and Hindi (preview) language packs with starter curriculum.
- Append-only progress events (`POST /progress/events`) and summary projection.
- `lesson_plans` / `lesson_items` persistence and `/lesson-journey/generate`,
  a protected two-model (drafter + reviewer) generation endpoint that rejects
  malformed output before persisting.
- Provider gateway abstraction with local Ollama as the default provider.
- Tutor pet word assistant (`POST /assistant/word`) with explanation-language
  support.

Everything below extends this foundation. None of it requires abandoning the
event-sourced/server-authoritative model.

---

## Stage 1 — Adaptive lessons from learning history

Goal: "Teach me Kannada today" resumes from what was already taught, instead of
restarting from lesson 1 or generating unrelated content.

Status: **in progress**

**Also shipped as part of this stage:** a "Learned words" history list on the
Progress tab (`GET /profiles/{profile_id}/learned-words`), showing every
completed word/phrase with native script, romanized form, meaning, and
completion time — resolved from progress events against both generated plans
and language-pack catalogs. Updated 2026-08-02: words are now grouped by
(language, phrase, meaning) instead of by raw activity id, since a
regenerated plan gives the same catalog phrase a new activity id each time —
grouping by raw id showed the same phrase as separate "duplicate" rows once a
learner had done a few review sessions. Each word now carries a
`times_completed` count and its most recent completion time; `apps/web_pwa`'s
Progress tab shows a "×N" badge when a word has been learned more than once.

1.1 **Harden two-model JSON generation** (known issue #1 in `CLAUDE.md`)

  Status: **completed** — implemented in `apps/api/app/lesson_generator.py`:
  - Response token budget now scales with `target_count` instead of a fixed
    350 tokens, which was likely truncating mid-JSON for 8-12 activity plans.
  - Each of the tutor and reviewer steps gets up to 3 attempts. A failed
    attempt (bad JSON, missing fields, empty list) feeds the exact parse
    error back into a corrective follow-up prompt instead of failing the
    whole plan immediately.
  - Added a best-effort JSON repair pass (trailing commas, truncated
    trailing object) before giving up on an attempt.
  - `LessonGenerationError` now carries an attempt-by-attempt `diagnostics`
    list for backend logs, without exposing raw model output to clients.
  - Root-caused and fixed a separate empty-response failure mode
    (`BV-LESSON-GEN-002`): `qwen3:30b`'s hybrid "thinking" mode could
    consume the entire token budget on `<think>` tokens and return
    `response: ""`. `generate_with_ollama` now sends `"think": false`, and
    the default local model was switched to `gemma4:latest`.
  - Covered by unit tests in `apps/api/tests/test_lesson_generator.py`
    (malformed-JSON recovery, exhausted-retries diagnostics).
  - Marked done on the basis of live usage rather than a single isolated
    test run: the user has generated multiple full plans successfully with
    `gemma4:latest` in normal use (including the plan that surfaced
    `BV-REPEAT-CATALOG-001`, and the `request_text`-driven plans for Stage
    1.3), with no generation failures reported since the `think: false` /
    `gemma4` fix. The original "5 consecutive generations, no manual
    retry" acceptance was written for a formal test harness that was never
    built separately from this observed usage.

1.2 **Progress-aware activity selection**

  Status: **in progress** —
  - Root-caused and fixed why progress looked like it "reset": the lesson
    screen's Next button never recorded a completion event on its own (only
    the separate Complete button did), so paging through with Next alone
    left `completed_activities` at 0 server-side. `_next()` now
    auto-completes the current activity before advancing.
  - `store.get_completed_catalog_pairs()` resolves which catalog
    (phrase, meaning) pairs a profile has already completed, and
    `generate_lesson_plan` now passes that into the tutor prompt so
    regeneration prefers not-yet-learned catalog items over reproducing an
    overlapping set, falling back to explicit review framing once the
    catalog is exhausted.
  - Updated 2026-08-02: that "prefer new items" instruction was only a
    prompt-level hint the model could ignore, which became visible once
    the catalog grew via the Catalog tab (`BV-REPEAT-CATALOG-001`) — the
    model kept re-picking familiar early-catalog phrases. Added
    `_ensure_new_phrase_coverage`, a deterministic backend top-up: if the
    model-selected plan doesn't include enough not-yet-completed catalog
    items, the backend fills the gap itself from the catalog (never
    model-invented content). "Prefer unseen" is now a guarantee, not just
    a hint.
  - Still open: no per-item score/strength signal (`activity_completed`
    events don't carry a mastery score), so there's no
    weak/low-score-first prioritization yet, only unseen-first. Also
    inherently capped by catalog size once every phrase is completed at
    least once.
  - Acceptance: a profile with 6 completed activities and 2 low-score
    activities gets a plan that reviews the weak items before new ones.
    (Not yet met — needs the mastery-score signal above.)

1.3 **"Teach me X" launcher**

  Status: **completed** (2026-08-02) —
  - `apps/api/app/lesson_request.py` (`parse_lesson_request`) does
    best-effort keyword/number parsing of free-form text into
    `target_count` and `mode` ("review" | "new") hints -- deliberately
    regex/keyword heuristics, not another model call, since this only
    interprets the learner's own request in their explanation language.
  - `generate_lesson_plan` accepts an optional `request_text` field
    (`apps/api/app/lesson_generator.py`): explicit `target_count`/`mode`
    payload fields always win over the parsed hint. `mode="review"` builds
    the tutor prompt from only already-completed catalog phrases and skips
    the new-phrase top-up step; the default/"new" case is unchanged from
    Stage 1.2. The response carries a `request_interpretation` object
    (`request_text`, `resolved_mode`, `resolved_target_count`) so the
    caller can show how the request was understood.
  - `apps/web_pwa`'s lesson screen (`SessionPanel.tsx`) has a "Teach
    me... (optional)" text box next to Generate plan; leaving it blank
    keeps the previous fixed-8-activity behavior. The completion banner
    shows the resolved interpretation (e.g. "review phrases, 4
    activities").
  - Topic-specific scoping (e.g. "teach me food words") is not implemented
    -- the starter catalog has no topic/category tagging yet, so there is
    nothing to scope by beyond mode and count.
  - Covered by `apps/api/tests/test_lesson_request.py` and new cases in
    `test_lesson_generator.py` (count-only, explicit-count-wins, and
    review-mode-only-uses-completed-phrases).
  - Not yet validated against a live Ollama run -- the parsing itself is
    deterministic and unit-tested, but end-to-end model behavior with a
    real `request_text` prompt hasn't been confirmed on the user's machine.

1.4 **Session recap tied to history**

  Status: **planned** — not started.
  - After a lesson, show what was reviewed vs. newly taught, referencing
    prior sessions, not just the current one.

Primary paths touched: `apps/api/app/` (lesson journey + progress query
join), `domains/tutoring`, `apps/mobile_flutter/lib/features/learning_session`.

---

## Stage 2 — Two-bot scenario conversation studio

Goal: give a scenario ("ordering food at a restaurant"), two model personas
converse in the target language, the conversation is recorded, and it can be
replayed later with meanings attached to each line.

Status: **planned**

2.1 **Scenario input + conversation contract**
  - New endpoint `POST /scenarios` accepting `{ language, scenario_text,
    explanation_language, turn_count }`.
  - Define the conversation contract (list of turns, speaker, native text,
    transliteration, meaning) as a versioned schema, same discipline as
    `progress-event-envelope.md`.

2.2 **Dialogue generation (director + two actors)**
  - Reuse the provider gateway's two-model pattern from lesson generation:
    one model drafts the scene as structured turns, a reviewer model
    validates line-by-line (child-safety, language correctness, schema).
  - Output must be rejected and regenerated if turns are malformed —
    same "never persist bad content" rule as lesson generation.

2.3 **Multi-voice text-to-speech**
  - Add a TTS provider entry to the provider gateway capable of at least two
    distinct voices (voice A / voice B), driven by the language pack's
    `voice.preferred_tts_provider`.
  - Synthesize each turn, then stitch into one conversation audio file with
    small pauses between speakers.

2.4 **Playback + transcript UI**
  - New "Scenario Studio" screen: enter/select a scenario, generate, then
    play the recorded audio with a synced transcript (native script +
    transliteration + meaning per line), matching the tutor pet's existing
    explanation-language pattern.

2.5 **Save and revisit recordings**
  - Persist generated conversations (audio reference + transcript) per
    profile so they can be replayed later, not just at generation time.

Primary paths touched: `apps/api/app/` (new scenario domain),
`platform/provider_gateway`, new `apps/mobile_flutter/lib/features/scenario_studio`,
new `domains/conversations` (per the target repo architecture in the agent/skills
plan).

---

## Stage 3 — Personalized voice tutor (comfortable-language, consistent voice)

Goal: speak to the tutor in the language you're comfortable in (e.g. Telugu or
English); it understands you, replies in the target language, and always
replies in the same recognizable voice — not a different random voice each
time.

Status: **planned**

**Stopgap already shipped (not part of the Stage 3 acceptance criteria
below):** the lesson screen's "Play phrase" and "Record answer" buttons were
previously wired to empty `onPressed: () {}` handlers — they did nothing.
They now use `flutter_tts` and `speech_to_text` (browser/OS voice APIs
running entirely on-device, no backend call) so the buttons work today:
play speaks the phrase, record shows a live transcript of what the browser
heard. See `apps/mobile_flutter/lib/core/voice/voice_service.dart`. This is
a deliberately temporary implementation — it cannot guarantee a consistent
voice per profile, has no backend-side pronunciation feedback, and Kannada/
Hindi voice coverage depends entirely on what the browser/OS has installed.
Stage 3 below replaces it with the provider-gateway STT/TTS approach.

3.1 **Speech-to-text for the explanation language**
  - Add an STT provider to the gateway. Input: learner's spoken comfortable
    language. Output: transcribed text passed to the tutor prompt alongside
    the existing `explanation_language` field already sent by the tutor pet.

3.2 **Consistent per-profile TTS voice**
  - Add a `voice_id` (or provider-specific voice handle) to the learner
    profile. All tutor responses for that profile use the same voice
    every time, independent of which model/provider generated the text.
  - Acceptance: two separate tutor replies for the same profile, generated
    by different underlying text models, are indistinguishable by voice.

3.3 **Bilingual turn-taking**
  - Learner speaks/types in comfortable language → transcribed → tutor
    replies in target language (with transliteration) → synthesized in the
    profile's voice → learner hears it and can respond again.
  - This is a conversational loop, not a single Q&A call — reuse the
    scenario contract from Stage 2 where useful (turns, meanings) rather
    than inventing a second format.

3.4 **Push-to-talk mobile integration**
  - Wire microphone capture (already scoped in the mobile roadmap) into
    this loop from the lesson/tutor pet UI.

Primary paths touched: `platform/provider_gateway` (STT/TTS additions),
`platform/family_profiles` (voice_id field), `apps/mobile_flutter/lib/features/tutor_pet`,
`domains/tutoring`.

---

## Sequencing and dependencies

```text
Stage 0 (done)
   |
   v
Stage 1 (adaptive lessons) ---> improves the same generation pipeline
   |                             Stage 2 and 3 both reuse
   v
Stage 2 (two-bot conversations) --- shares: two-model pattern, TTS provider,
   |                                 conversation/turn schema
   v
Stage 3 (personalized voice tutor) --- reuses: TTS voice pipeline from Stage 2,
                                        adds STT + persistent voice_id
```

Stage 1 should land first: it fixes the JSON-reliability problem that Stage 2
and 3 would otherwise inherit. Stage 2's multi-voice TTS work directly reduces
the effort for Stage 3's consistent-voice requirement, so building them in
this order avoids rework.

## Completion tracking

The Flutter **Roadmap** tab (`apps/mobile_flutter/lib/features/roadmap`) mirrors
this file's stage list with status badges. When a sub-step ships:

1. Flip its status here.
2. Update the matching entry in
   `apps/mobile_flutter/lib/features/roadmap/domain/roadmap_stage.dart`.
3. Update `.ai/current-state.yaml` and `.ai/change-log.yaml` per the
   workflow in `CLAUDE.md`.
