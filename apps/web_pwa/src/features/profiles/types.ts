// Mirrors apps/mobile_flutter/lib/features/profiles/domain/learner_profile.dart.
export type ProfileType = 'adult' | 'child';

export interface LearnerProfile {
  id: string;
  displayName: string;
  type: ProfileType;
  ageGroup: string;
  explanationLanguage: string;
  sessionMinutes: number;
}

export function isChild(profile: LearnerProfile): boolean {
  return profile.type === 'child';
}

export function typeLabel(profile: LearnerProfile): string {
  return profile.type === 'child' ? 'Child' : 'Adult';
}

export function profileToJson(profile: LearnerProfile): Record<string, unknown> {
  return {
    id: profile.id,
    display_name: profile.displayName,
    type: profile.type,
    age_group: profile.ageGroup,
    explanation_language: profile.explanationLanguage,
    session_minutes: profile.sessionMinutes,
  };
}

export function profileFromJson(json: Record<string, unknown>): LearnerProfile {
  const typeValue = (json.type as string | undefined) ?? 'adult';
  return {
    id: json.id as string,
    displayName: json.display_name as string,
    type: typeValue === 'child' ? 'child' : 'adult',
    ageGroup: json.age_group as string,
    explanationLanguage: json.explanation_language as string,
    sessionMinutes: json.session_minutes as number,
  };
}
