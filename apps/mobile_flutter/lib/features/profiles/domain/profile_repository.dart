import '../../../core/api/api_client.dart';
import 'learner_profile.dart';

class ProfileRepository {
  const ProfileRepository(this.apiClient);

  final ApiClient apiClient;

  Future<List<LearnerProfile>> fetchProfiles() async {
    final rows = await apiClient.getList('/profiles');
    return rows
        .cast<Map<String, dynamic>>()
        .map(LearnerProfile.fromJson)
        .toList(growable: false);
  }

  Future<LearnerProfile> saveProfile(LearnerProfile profile) async {
    final json = await apiClient.postMap('/profiles', profile.toJson());
    return LearnerProfile.fromJson(json);
  }
}
