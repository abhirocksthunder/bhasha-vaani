import type { ApiClient } from '../../core/api/apiClient';
import {
  catalogCandidateFromJson,
  catalogCandidateToJson,
  type ApproveResult,
  type CatalogCandidate,
  type GenerateCandidatesResult,
} from './types';

/** Thrown when the backend explicitly rejects a request (accepted: false),
 * carrying its human-readable reason (and, for generation, per-attempt
 * diagnostics) the same way LessonGenerationException does for lesson
 * plans -- see apps/api/app/catalog_generator.py for why generation and
 * writing to the catalog are deliberately two separate calls. */
export class CatalogGenerationException extends Error {}

export class CatalogRepository {
  private readonly apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async generateCandidates({
    languageCode,
    model,
    count,
  }: {
    languageCode: string;
    model: string;
    count: number;
  }): Promise<GenerateCandidatesResult> {
    const json = await this.apiClient.postMap<Record<string, unknown>>(
      `/catalog/${encodeURIComponent(languageCode)}/generate-candidates`,
      { model, count },
    );

    if (json.accepted === false) {
      throw new CatalogGenerationException((json.error as string | undefined) ?? 'Candidate generation was rejected.');
    }

    const candidates = (json.candidates as Record<string, unknown>[] | undefined) ?? [];
    return {
      languageCode: (json.language_code as string | undefined) ?? languageCode,
      languageName: (json.language_name as string | undefined) ?? languageCode,
      model: (json.model as string | undefined) ?? model,
      candidates: candidates.map(catalogCandidateFromJson),
      diagnostics: (json.diagnostics as string[] | undefined) ?? [],
    };
  }

  async approveCandidates({
    languageCode,
    approved,
  }: {
    languageCode: string;
    approved: CatalogCandidate[];
  }): Promise<ApproveResult> {
    const json = await this.apiClient.postMap<Record<string, unknown>>(
      `/catalog/${encodeURIComponent(languageCode)}/approve`,
      { items: approved.map(catalogCandidateToJson) },
    );

    if (json.accepted === false) {
      throw new CatalogGenerationException((json.error as string | undefined) ?? 'Approval was rejected.');
    }

    return {
      added: (json.added as number | undefined) ?? 0,
      total: (json.total as number | undefined) ?? 0,
      skipped: (json.skipped as number | undefined) ?? 0,
    };
  }
}
