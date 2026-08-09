import type { ApiClient } from '../../core/api/apiClient';
import { ollamaModelFromJson, type OllamaModel } from './types';

// GET /providers/ollama/models, shared between the tutor pet and the lesson
// screen (mirrors how apps/mobile_flutter/lib/core/api/ollama_model.dart is
// shared between tutor_pet_button.dart and learning_session_screen.dart).
export class OllamaRepository {
  private readonly apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async fetchModels(): Promise<OllamaModel[]> {
    const json = await this.apiClient.getMap<Record<string, unknown>>('/providers/ollama/models');
    const models = (json.models as Record<string, unknown>[] | undefined) ?? [];
    return models.map(ollamaModelFromJson);
  }
}
