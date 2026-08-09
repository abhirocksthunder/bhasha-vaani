// Mirrors apps/mobile_flutter/lib/features/learning_session/domain/lesson_activity.dart.
export interface LessonActivity {
  id: string;
  title: string;
  prompt: string;
  /** Romanized form, used for on-screen reading when the learner may not read the target script yet. */
  phrase: string;
  meaning: string;
  /** Native-script text (e.g. ನಮಸ್ಕಾರ, नमस्ते). Falls back to `phrase` when the catalog doesn't provide it. */
  nativeScript: string;
}

export function lessonActivityFromJson(json: Record<string, unknown>): LessonActivity {
  const phrase = (json.phrase as string | undefined) ?? '';
  return {
    id: (json.id as string | undefined) ?? '',
    title: (json.title as string | undefined) ?? 'Practice',
    prompt: (json.prompt as string | undefined) ?? '',
    phrase,
    meaning: (json.meaning as string | undefined) ?? '',
    nativeScript: (json.native_script as string | undefined) ?? phrase,
  };
}

// Stage 1.3 (docs/product/roadmap-learning-features.md): "teach me X"
// launcher. Mirrors the shape returned by apps/api/app/lesson_generator.py's
// `request_interpretation` field, so the UI can show how a free-form
// request like "5 new words today" was actually understood.
export interface RequestInterpretation {
  requestText: string;
  resolvedMode: 'review' | 'new' | 'balanced' | string;
  resolvedTargetCount: number;
}

export function requestInterpretationFromJson(
  json: Record<string, unknown> | null | undefined,
): RequestInterpretation | null {
  if (!json) return null;
  return {
    requestText: (json.request_text as string | undefined) ?? '',
    resolvedMode: (json.resolved_mode as string | undefined) ?? 'balanced',
    resolvedTargetCount: (json.resolved_target_count as number | undefined) ?? 8,
  };
}

// Mirrors apps/mobile_flutter/lib/core/api/ollama_model.dart.
export interface OllamaModel {
  name: string;
  parameterSize: string;
  family: string;
}

export function ollamaModelLabel(model: OllamaModel): string {
  return [model.name, model.parameterSize, model.family].filter(Boolean).join(' - ');
}

export function ollamaModelFromJson(json: Record<string, unknown>): OllamaModel {
  return {
    name: (json.name as string | undefined) ?? '',
    parameterSize: (json.parameter_size as string | undefined) ?? '',
    family: (json.family as string | undefined) ?? '',
  };
}
