import '../../../core/api/api_client.dart';
import '../../language_selection/domain/language_pack.dart';
import '../../profiles/domain/learner_profile.dart';
import 'lesson_activity.dart';

class LessonRepository {
  const LessonRepository(this.apiClient);

  final ApiClient apiClient;

  Future<List<LessonActivity>> fetchJourneyActivities({
    required LearnerProfile profile,
    required LanguagePack language,
  }) async {
    final json = await apiClient.postMap(
      '/lesson-journey',
      {
        'profile_id': profile.id,
        'language_code': language.code,
      },
    );
    final activities = json['activities'] as List<dynamic>? ?? const [];
    return [
      for (final activity in activities)
        LessonActivity.fromJson(activity as Map<String, dynamic>),
    ];
  }

  Future<List<LessonActivity>> generateJourneyActivities({
    required LearnerProfile profile,
    required LanguagePack language,
    String? ollamaModel,
  }) async {
    // When a specific Ollama model is picked in the UI, use it for both the
    // tutor and reviewer steps. Otherwise fall back to the provider
    // gateway's own default-model selection (platform/provider_gateway/
    // provider_config.yaml, with a heuristic fallback if that's not
    // installed).
    final modelRoute = ollamaModel == null || ollamaModel.isEmpty
        ? 'local_ollama'
        : 'ollama:$ollamaModel';

    final json = await apiClient.postMap(
      '/lesson-journey/generate',
      {
        'profile_id': profile.id,
        'language_code': language.code,
        'explanation_language': profile.explanationLanguage,
        'profile': profile.toJson(),
        'tutor_model': modelRoute,
        'reviewer_model': modelRoute,
        'target_count': 8,
      },
    );

    // The backend returns HTTP 200 with {"accepted": false, "error": "..."}
    // when generation failed and nothing new was saved (it never persists
    // unvalidated model output). Treat that as a real failure instead of
    // silently reading a missing "activities" key as an empty list, which
    // previously made the UI claim success while quietly falling back to
    // whatever was already loaded.
    if (json['accepted'] == false) {
      throw LessonGenerationException(
        json['error'] as String? ?? 'Lesson generation was rejected by the backend.',
      );
    }

    final activities = json['activities'] as List<dynamic>? ?? const [];
    return [
      for (final activity in activities)
        LessonActivity.fromJson(activity as Map<String, dynamic>),
    ];
  }
}

/// Thrown when the backend explicitly rejects a generated lesson plan
/// (`{"accepted": false, ...}`), as opposed to a transport-level failure.
/// Carries the backend's human-readable reason so the UI can show it
/// instead of a generic error.
class LessonGenerationException implements Exception {
  const LessonGenerationException(this.reason);

  final String reason;

  @override
  String toString() => reason;
}
