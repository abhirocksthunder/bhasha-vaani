# ADR-001: Flutter First With Firebase Web Deployment

## Status

Accepted

## Context

BhashaVaani needs a mobile app later, but the frontend should also be accessible anywhere through Firebase Hosting. The core experience includes audio playback, recording, offline lessons, progress sync, and child-friendly mobile interactions.

## Decision

Use Flutter as the primary client technology. Deploy Flutter Web to Firebase Hosting for browser access, and build Android from the same codebase.

The backend remains separate and runs locally first. Flutter clients call the backend through HTTPS when remote access is needed.

## Consequences

- Mobile and web share most product UI and client-side state code.
- Flutter Web may have larger bundles and weaker browser-native SEO than React or Next.js.
- Audio and offline capabilities can be implemented more naturally for Android later.
- React or Next.js may still be introduced later for public marketing, admin dashboards, or language pack management if needed.
