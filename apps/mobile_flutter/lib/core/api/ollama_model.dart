/// An Ollama model as reported by GET /providers/ollama/models. Shared
/// between the tutor pet (word lookups) and the lesson screen (lesson plan
/// generation) so both pick from the same installed-model list instead of
/// each hardcoding a duplicate model class.
class OllamaModel {
  const OllamaModel({
    required this.name,
    required this.parameterSize,
    required this.family,
  });

  final String name;
  final String parameterSize;
  final String family;

  String get label {
    final parts = [
      name,
      if (parameterSize.isNotEmpty) parameterSize,
      if (family.isNotEmpty) family,
    ];
    return parts.join(' - ');
  }

  factory OllamaModel.fromJson(Map<String, dynamic> json) {
    return OllamaModel(
      name: json['name'] as String? ?? '',
      parameterSize: json['parameter_size'] as String? ?? '',
      family: json['family'] as String? ?? '',
    );
  }
}
