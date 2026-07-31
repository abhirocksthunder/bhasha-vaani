# Provider Gateway

All model access must go through this layer.

The tutoring engine should ask for language-learning output. It should not know whether the request is served by local Ollama, LM Studio, OpenAI, Anthropic, Gemini, or another provider.

## Provider Direction

```text
LLMProvider
  LocalOllamaProvider
  LocalLmStudioProvider
  OpenAIProvider
  AnthropicProvider
  GoogleProvider
```

Local providers are the default. Frontier providers are optional and disabled until configured.
