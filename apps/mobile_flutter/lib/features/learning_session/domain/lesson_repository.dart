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
}
