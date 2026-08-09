import type { ApiClient } from '../../core/api/apiClient';
import { languagePackFromJson, type LanguagePack } from './types';

// Mirrors apps/mobile_flutter/lib/features/language_selection/domain/language_repository.dart.
export class LanguageRepository {
  private readonly apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async fetchLanguages(): Promise<LanguagePack[]> {
    const rows = await this.apiClient.getList<Record<string, unknown>>('/languages');
    return rows.map(languagePackFromJson);
  }
}
