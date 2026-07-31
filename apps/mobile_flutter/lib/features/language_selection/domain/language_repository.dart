import '../../../core/api/api_client.dart';
import 'language_pack.dart';

class LanguageRepository {
  const LanguageRepository(this.apiClient);

  final ApiClient apiClient;

  Future<List<LanguagePack>> fetchLanguages() async {
    final rows = await apiClient.getList('/languages');
    return rows
        .cast<Map<String, dynamic>>()
        .map(LanguagePack.fromJson)
        .toList(growable: false);
  }
}
