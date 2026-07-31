# Architecture Overview

BhashaVaani is built as a shared learning platform with multiple clients.

```text
Flutter Android
Flutter Web on Firebase
AI OS integration
Alexa adapter later
        |
        v
BhashaVaani API
        |
        +-- Family Profile Engine
        +-- Language Registry
        +-- Tutoring Engine
        +-- Progress Engine
        +-- Provider Gateway
        +-- Content Safety
```

The backend runs locally first. Remote access should use a secure HTTPS tunnel such as Cloudflare Tunnel, with Firebase Auth tokens verified by the backend before profile or lesson APIs are allowed.

## AI Provider Direction

Local models are the default. The tutoring engine must call a provider gateway rather than directly calling Ollama, LM Studio, OpenAI, Anthropic, or Gemini.

Provider implementations can be added behind a common interface:

```text
LocalOllamaProvider
LocalLmStudioProvider
OpenAIProvider
AnthropicProvider
GoogleProvider
```

## Client Direction

Flutter is the primary client technology. Flutter Web is used for Firebase Hosting and browser access. Android is the primary native mobile target.
