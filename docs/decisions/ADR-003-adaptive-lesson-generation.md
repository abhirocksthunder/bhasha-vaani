# ADR-003: Adaptive Lesson Generation With Reviewed Local Models

## Status

Accepted

## Context

BhashaVaani needs to move beyond fixed starter lessons while preserving correctness, child safety, and local-first model routing.

## Decision

Lesson plans are persisted on the local backend. The Flutter client requests lesson plans from the backend and may ask the backend to generate a new plan.

Generation uses a two-step model flow behind the provider gateway:

1. Tutor model drafts lesson items.
2. Reviewer model repairs or rejects the draft.
3. Backend validates the final structure before persistence.

Language-specific phrase inventory belongs in language pack curriculum files. The tutoring engine may use those catalogs but must not embed language-specific curriculum content.

## Consequences

- Generated content can be reused across web/mobile sessions.
- Bad model output is rejected before it becomes server state.
- Local models remain swappable through provider routes.
- Reliable JSON output from local models is now a known capability requirement.
