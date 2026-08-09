import '../../../core/api/api_client.dart';
import '../../language_selection/domain/language_pack.dart';
import '../../profiles/domain/learner_profile.dart';
import 'learned_word.dart';
import 'progress_event.dart';
import 'progress_summary.dart';

class ProgressRepository {
  const ProgressRepository(this.apiClient);

  final ApiClient apiClient;

  Future<ProgressSummary> fetchSummary({
    required LearnerProfile profile,
    required LanguagePack language,
  }) async {
    // Scoped to the selected language -- see BV-PROGRESS-SCOPE-001. An
    // unscoped/global completed_activities count could exceed a smaller
    // language's own catalog size and corrupt the lesson-journey
    // next_index/state calc, making every activity in that language look
    // already completed.
    final json = await apiClient.getMap(
      '/profiles/${profile.id}/progress?language_code=${Uri.encodeComponent(language.code)}',
    );
    return ProgressSummary.fromJson(
      profileName: profile.displayName,
      languageName: language.name,
      json: json,
    );
  }

  Future<List<LearnedWord>> fetchLearnedWords({
    required LearnerProfile profile,
    required LanguagePack language,
  }) async {
    final json = await apiClient.getMap(
      '/profiles/${profile.id}/learned-words?language_code=${language.code}',
    );
    final words = json['words'] as List<dynamic>? ?? const [];
    return [
      for (final word in words)
        LearnedWord.fromJson(word as Map<String, dynamic>),
    ];
  }

  Future<void> recordActivityCompleted({
    required LearnerProfile profile,
    required LanguagePack language,
    required String activityId,
    required int clientSequence,
  }) async {
    final event = await buildActivityCompletedEvent(
      profile: profile,
      language: language,
      activityId: activityId,
      clientSequence: clientSequence,
    );
    await uploadEvent(event);
  }

  ProgressEvent buildActivityCompletedEvent({
    required LearnerProfile profile,
    required LanguagePack language,
    required String activityId,
    required int clientSequence,
  }) {
    return ProgressEvent.activityCompleted(
      profileId: profile.id,
      languageCode: language.code,
      activityId: activityId,
      clientSequence: clientSequence,
    );
  }

  Future<void> uploadEvent(ProgressEvent event) async {
    await apiClient.postMap(
      '/progress/events',
      event.toJson(),
    );
  }
}
