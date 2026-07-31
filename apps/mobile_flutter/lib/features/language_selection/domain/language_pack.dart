enum LanguageSupportStatus {
  full,
  beta,
  preview,
  planned,
}

class LanguagePack {
  const LanguagePack({
    required this.code,
    required this.name,
    required this.nativeName,
    required this.status,
    required this.transliteration,
    required this.speechToText,
    required this.textToSpeech,
    required this.pronunciation,
  });

  final String code;
  final String name;
  final String nativeName;
  final LanguageSupportStatus status;
  final bool transliteration;
  final bool speechToText;
  final bool textToSpeech;
  final String pronunciation;

  factory LanguagePack.fromJson(Map<String, dynamic> json) {
    final statusValue = json['status'] as String? ?? 'planned';

    return LanguagePack(
      code: json['code'] as String,
      name: json['name'] as String,
      nativeName: json['native_name'] as String? ?? json['name'] as String,
      status: switch (statusValue) {
        'full' => LanguageSupportStatus.full,
        'beta' => LanguageSupportStatus.beta,
        'preview' => LanguageSupportStatus.preview,
        _ => LanguageSupportStatus.planned,
      },
      transliteration: json['transliteration'] as bool? ?? false,
      speechToText: json['speech_to_text'] as bool? ?? false,
      textToSpeech: json['text_to_speech'] as bool? ?? false,
      pronunciation: json['pronunciation'] as String? ?? 'Later',
    );
  }

  String get statusLabel => switch (status) {
        LanguageSupportStatus.full => 'Full',
        LanguageSupportStatus.beta => 'Beta',
        LanguageSupportStatus.preview => 'Preview',
        LanguageSupportStatus.planned => 'Planned',
      };
}
