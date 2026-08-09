import { ApiException, type ApiClient } from '../../core/api/apiClient';
import type { LearnerProfile } from '../profiles/types';
import type { LanguagePack } from '../languages/types';
import {
  lessonActivityFromJson,
  requestInterpretationFromJson,
  type LessonActivity,
  type RequestInterpretation,
} from './types';

// Mirrors apps/mobile_flutter/lib/features/learning_session/domain/lesson_repository.dart.

/** Thrown when the backend explicitly rejects a generated lesson plan
 * (`{"accepted": false, ...}`), as opposed to a transport-level failure.
 * Carries the backend's human-readable reason (including per-attempt
 * diagnostics) so the UI can show it instead of a generic error. */
export class LessonGenerationException extends Error {}

export class LessonRepository {
  private readonly apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async fetchJourneyActivities({
    profile,
    language,
  }: {
    profile: LearnerProfile;
    language: LanguagePack;
  }): Promise<LessonActivity[]> {
    const json = await this.apiClient.postMap<Record<string, unknown>>('/lesson-journey', {
      profile_id: profile.id,
      language_code: language.code,
    });
    const activities = (json.activities as Record<string, unknown>[] | undefined) ?? [];
    return activities.map(lessonActivityFromJson);
  }

  async generateJourneyActivities({
    profile,
    language,
    ollamaModel,
    requestText,
  }: {
    profile: LearnerProfile;
    language: LanguagePack;
    ollamaModel?: string | null;
    /** Stage 1.3 "teach me X" free-form request, e.g. "5 new words today"
     * or "review what we did". When present and non-empty, target_count is
     * omitted so the backend's parse_lesson_request hint can size the plan
     * instead of always requesting a fixed 8. */
    requestText?: string | null;
  }): Promise<{ activities: LessonActivity[]; interpretation: RequestInterpretation | null }> {
    // When a specific Ollama model is picked in the UI, use it for both the
    // tutor and reviewer steps. Otherwise fall back to the provider
    // gateway's own default-model selection.
    const modelRoute = ollamaModel ? `ollama:${ollamaModel}` : 'local_ollama';
    const trimmedRequestText = requestText?.trim() || '';

    let json: Record<string, unknown>;
    try {
      json = await this.apiClient.postMap<Record<string, unknown>>('/lesson-journey/generate', {
        profile_id: profile.id,
        language_code: language.code,
        explanation_language: profile.explanationLanguage,
        profile: {
          id: profile.id,
          display_name: profile.displayName,
          type: profile.type,
          age_group: profile.ageGroup,
          explanation_language: profile.explanationLanguage,
          session_minutes: profile.sessionMinutes,
        },
        tutor_model: modelRoute,
        reviewer_model: modelRoute,
        ...(trimmedRequestText ? { request_text: trimmedRequestText } : { target_count: 8 }),
      });
    } catch (error) {
      if (error instanceof ApiException) {
        throw new LessonGenerationException(`Could not reach the backend: ${error.message}`);
      }
      throw error;
    }

    // The backend returns HTTP 200 with {"accepted": false, "error": "..."}
    // when generation failed and nothing new was saved (it never persists
    // unvalidated model output). Treat that as a real failure instead of
    // silently reading a missing "activities" key as an empty list.
    if (json.accepted === false) {
      throw new LessonGenerationException(
        (json.error as string | undefined) ?? 'Lesson generation was rejected by the backend.',
      );
    }

    const activities = (json.activities as Record<string, unknown>[] | undefined) ?? [];
    const interpretation = requestInterpretationFromJson(
      json.request_interpretation as Record<string, unknown> | null | undefined,
    );
    return { activities: activities.map(lessonActivityFromJson), interpretation };
  }
}
