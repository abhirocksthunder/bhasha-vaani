import type { LearnerProfile } from '../profiles/types';
import type { LanguagePack } from '../languages/types';

// Mirrors apps/mobile_flutter/lib/features/progress/domain/progress_event.dart.
export interface ProgressEvent {
  eventId: string;
  profileId: string;
  deviceId: string;
  sessionId: string;
  eventType: string;
  entityId: string;
  occurredAt: string;
  recordedAt: string;
  clientSequence: number;
  payload: Record<string, unknown>;
  schemaVersion: number;
}

export function progressEventToJson(event: ProgressEvent): Record<string, unknown> {
  return {
    event_id: event.eventId,
    profile_id: event.profileId,
    device_id: event.deviceId,
    session_id: event.sessionId,
    event_type: event.eventType,
    entity_id: event.entityId,
    occurred_at: event.occurredAt,
    recorded_at: event.recordedAt,
    client_sequence: event.clientSequence,
    payload: event.payload,
    schema_version: event.schemaVersion,
  };
}

export function progressEventFromJson(json: Record<string, unknown>): ProgressEvent {
  return {
    eventId: json.event_id as string,
    profileId: json.profile_id as string,
    deviceId: json.device_id as string,
    sessionId: json.session_id as string,
    eventType: json.event_type as string,
    entityId: json.entity_id as string,
    occurredAt: json.occurred_at as string,
    recordedAt: json.recorded_at as string,
    clientSequence: json.client_sequence as number,
    payload: (json.payload as Record<string, unknown>) ?? {},
    schemaVersion: (json.schema_version as number | undefined) ?? 1,
  };
}

export function buildActivityCompletedEvent({
  profile,
  language,
  activityId,
  clientSequence,
}: {
  profile: LearnerProfile;
  language: LanguagePack;
  activityId: string;
  clientSequence: number;
}): ProgressEvent {
  const isoNow = new Date().toISOString();
  return {
    eventId: `evt_${profile.id}_${activityId}_${clientSequence}`,
    profileId: profile.id,
    deviceId: 'web_pwa_dev',
    sessionId: `session_${profile.id}_${language.code}_starter`,
    eventType: 'activity_completed',
    entityId: activityId,
    occurredAt: isoNow,
    recordedAt: isoNow,
    clientSequence,
    payload: { score: 1.0, attempt_count: 1 },
    schemaVersion: 1,
  };
}

// Mirrors apps/mobile_flutter/lib/features/progress/domain/progress_summary.dart.
export interface ProgressSummary {
  profileName: string;
  languageName: string;
  completedActivities: number;
  pendingReviews: number;
  currentLesson: string;
  syncState: string;
}

export function seedProgressSummary(profileName: string, languageName: string): ProgressSummary {
  return {
    profileName,
    languageName,
    completedActivities: 2,
    pendingReviews: 6,
    currentLesson: 'Starter lesson 1',
    syncState: 'Local-first demo',
  };
}

export function progressSummaryFromJson(
  profileName: string,
  languageName: string,
  json: Record<string, unknown>,
): ProgressSummary {
  return {
    profileName,
    languageName,
    completedActivities: (json.completed_activities as number | undefined) ?? 0,
    pendingReviews: (json.pending_reviews as number | undefined) ?? 0,
    currentLesson: (json.current_lesson as string | undefined) ?? 'Starter lesson 1',
    syncState: (json.sync_state as string | undefined) ?? 'Server projection',
  };
}

// Mirrors apps/mobile_flutter/lib/features/progress/domain/learned_word.dart.
export interface LearnedWord {
  activityId: string;
  title: string;
  phrase: string;
  nativeScript: string;
  meaning: string;
  languageCode: string;
  /** ISO-8601 timestamp string from the backend (occurred_at). */
  completedAt: string;
  /** How many times this exact phrase/meaning pair has been completed,
   * across the starter catalog and any number of regenerated plans (a
   * regenerated plan gives the same catalog phrase a new activity_id each
   * time, so the backend groups by phrase/meaning, not activity_id, to
   * avoid showing the same word as separate "duplicate" rows). */
  timesCompleted: number;
}

export function learnedWordCompletedAtLocal(word: LearnedWord): Date | null {
  const parsed = new Date(word.completedAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function learnedWordFromJson(json: Record<string, unknown>): LearnedWord {
  const phrase = (json.phrase as string | undefined) ?? '';
  return {
    activityId: (json.activity_id as string | undefined) ?? '',
    title: (json.title as string | undefined) ?? '',
    phrase,
    nativeScript: (json.native_script as string | undefined) ?? phrase,
    meaning: (json.meaning as string | undefined) ?? '',
    languageCode: (json.language_code as string | undefined) ?? '',
    completedAt: (json.completed_at as string | undefined) ?? '',
    timesCompleted: (json.times_completed as number | undefined) ?? 1,
  };
}
