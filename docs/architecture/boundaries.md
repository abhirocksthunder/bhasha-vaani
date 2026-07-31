# Architectural Boundaries

## Client Boundaries

- Flutter clients call backend APIs.
- Flutter clients do not call local model servers directly.
- Flutter clients may keep offline events locally, but the backend remains authoritative.

## Backend Boundaries

- API handlers delegate to domain or platform services.
- Provider-specific AI code belongs in `platform/provider_gateway`.
- Family profile logic belongs in `platform/family_profiles`.
- Language availability and capabilities belong in `platform/language_registry`.

## Domain Boundaries

- Progress events are immutable.
- Projections are derived from progress events.
- Language-specific curriculum belongs in `language_packs`.
- The tutoring engine consumes language pack contracts; it does not branch on Kannada, Hindi, Tamil, or other language codes.

## Safety Boundaries

- Child profiles cannot use unrestricted AI chat.
- Child lessons must use approved topics, constrained schemas, and output validation.
- Content safety policy changes require an ADR.
