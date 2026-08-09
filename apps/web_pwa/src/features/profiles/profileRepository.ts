import type { ApiClient } from '../../core/api/apiClient';
import { profileFromJson, profileToJson, type LearnerProfile } from './types';

// Mirrors apps/mobile_flutter/lib/features/profiles/domain/profile_repository.dart.
export class ProfileRepository {
  private readonly apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async fetchProfiles(): Promise<LearnerProfile[]> {
    const rows = await this.apiClient.getList<Record<string, unknown>>('/profiles');
    return rows.map(profileFromJson);
  }

  async saveProfile(profile: LearnerProfile): Promise<LearnerProfile> {
    const json = await this.apiClient.postMap<Record<string, unknown>>(
      '/profiles',
      profileToJson(profile),
    );
    return profileFromJson(json);
  }
}
