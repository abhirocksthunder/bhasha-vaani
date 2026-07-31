# ADR-002: Local Backend And Provider Gateway

## Status

Accepted

## Context

BhashaVaani should use local models first, while preserving the option to call frontier models later.

## Decision

Run the backend on this PC initially. All AI model access goes through a provider gateway. Clients never call model servers directly.

Remote access should expose only the backend API through a secure HTTPS tunnel and authenticated API surface.

## Consequences

- Local model privacy and cost control are preserved.
- Frontier providers can be added without rewriting the tutoring engine.
- Firebase-hosted web clients require a stable public API URL.
- Authentication and CORS must be handled before remote access is treated as production-like.
