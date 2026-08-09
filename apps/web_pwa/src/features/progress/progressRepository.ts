import type { ApiClient } from '../../core/api/apiClient';
import type { LearnerProfile } from '../profiles/types';
import type { LanguagePack } from '../languages/types';
import {
  buildActivityCompletedEvent,
  learnedWordFromJson,
  progressEventToJson,
  progressSummaryFromJson,
  type LearnedWord,
  type ProgressEvent,
  type ProgressSummary,
} from './types';

// Mirrors apps/mobile_flutter/lib/features/progress/domain/progress_repository.dart.
export class ProgressRepository {
  private readonly apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async fetchSummary({
    profile,
    language,
  }: {
    profile: LearnerProfile;
    language: LanguagePack;
  }): Promise<ProgressSummary> {
    // Scoped to the selected language so "Completed" reflects that
    // language's own catalog, not a cross-language total (see
    // BV-PROGRESS-SCOPE-001 -- a global count could exceed a smaller
    // catalog's size and made every activity look already completed).
    const json = await this.apiClient.getMap<Record<string, unknown>>(
      `/profiles/${profile.id}/progress?language_code=${encodeURIComponent(language.code)}`,
    );
    return progressSummaryFromJson(profile.displayName, language.name, json);
  }

  async fetchLearnedWords({
    profile,
    language,
  }: {
    profile: LearnerProfile;
    language: LanguagePack;
  }): Promise<LearnedWord[]> {
    const json = await this.apiClient.getMap<Record<string, unknown>>(
      `/profiles/${profile.id}/learned-words?language_code=${encodeURIComponent(language.code)}`,
    );
    const words = (json.words as Record<string, unknown>[] | undefined) ?? [];
    return words.map(learnedWordFromJson);
  }

  buildActivityCompletedEvent(args: {
    profile: LearnerProfile;
    language: LanguagePack;
    activityId: string;
    clientSequence: number;
  }): ProgressEvent {
    return buildActivityCompletedEvent(args);
  }

  async uploadEvent(event: ProgressEvent): Promise<void> {
    await this.apiClient.postMap('/progress/events', progressEventToJson(event));
  }
}
