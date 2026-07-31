# BhashaVaani

BhashaVaani is a mobile-first, local-AI-first language learning platform for families.

The first client is a Flutter app that can run on Android and Flutter Web. The web build is intended for Firebase Hosting so it can be reached anywhere, while the backend stays on this PC and talks to local models through a provider gateway.

## Initial Shape

```text
Flutter app / Flutter Web
        |
        v
FastAPI backend on local PC
        |
        v
Local model providers first, frontier providers optional later
```

## First Milestone

The first end-to-end milestone is:

1. Create adult and child learner profiles.
2. Select Kannada or Hindi.
3. Start a guided lesson.
4. Persist progress through append-only events.
5. Resume the correct lesson from another client later.

## Repository Layout

```text
apps/mobile_flutter       Flutter primary client
apps/api                  Local backend placeholder
domains                   Product domain modules
platform                  Shared platform services
language_packs            Installable language packs
docs                      Architecture and product documentation
.ai                       Agent-readable project memory
```

## Validate Language Packs

```text
python tools/validate_language_packs.py
```
