# Language Pack Manifest Contract

Language-specific behavior belongs in Language Packs. The tutoring engine must consume this contract rather than branching on language codes.

Each language pack must provide:

- `language`: code, display names, writing system, and text direction
- `support`: transliteration, STT, TTS, and pronunciation capability
- `explanation_languages`: languages available for explanations
- `levels`: supported learning levels
- `curriculum.entrypoint`: pack curriculum entrypoint
- `voice`: provider preferences and fallback provider
- `status`: `full`, `beta`, `preview`, `text_only`, or `planned`

Validate packs with:

```text
python tools/validate_language_packs.py
```

The validator emits language capability data shaped for the backend language registry.

Current validated starter packs:

- Kannada (`kn`): full
- Hindi (`hi`): preview
