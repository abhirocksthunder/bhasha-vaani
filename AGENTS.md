# BhashaVaani Agent Guide

## Product

BhashaVaani is a family language-learning platform. It is local-AI first, mobile-first, and designed so web, mobile, Alexa, AI OS, and future clients share the same profiles, language packs, progress, and tutoring engine.

## Start Here

Before editing code, read:

1. `.ai/current-state.yaml`
2. `.ai/project-map.yaml`
3. The relevant domain README or architecture document
4. The selected skill under `.ai/skills/` when skills are added
5. Related ADRs under `docs/decisions/`

Do not inspect the entire repository unless the task genuinely spans multiple domains.

## Architectural Rules

- Flutter is the primary client. Flutter Web may be deployed to Firebase Hosting.
- The backend runs locally first and exposes APIs through a secure tunnel when remote access is needed.
- AI providers must be accessed through provider gateways.
- Local models are the default; frontier providers must remain optional and swappable.
- Progress is event-sourced and append-only.
- Server state is authoritative.
- Clients may operate offline using queued local events.
- Language-specific behavior belongs in Language Packs.
- The tutoring engine must not contain language-specific conditions.
- Clients do not write mastery scores directly.
- LLM outputs must be validated before persistence.
- Child profiles use constrained content generation.
- Domain modules must not directly depend on client applications.

## Completion Requirements

Before completing a task:

- Run relevant tests or explain why they could not be run.
- Update `.ai/current-state.yaml`.
- Update `.ai/change-log.yaml`.
- Record unresolved issues in `.ai/known-issues.yaml`.
- Add or update an ADR if architecture changed.
- Provide a handoff summary.
