class LessonActivity {
  const LessonActivity({
    required this.id,
    required this.title,
    required this.prompt,
    required this.phrase,
    required this.meaning,
    String? nativeScript,
  }) : nativeScript = nativeScript ?? phrase;

  final String id;
  final String title;
  final String prompt;

  /// Romanized form of the phrase, used for on-screen reading when the
  /// learner may not read the target script yet.
  final String phrase;
  final String meaning;

  /// Native-script text (e.g. ನಮಸ್ಕಾರ, नमस्ते) when the language pack
  /// provides it. Falls back to [phrase] for catalogs/plans that have not
  /// been backfilled, so callers always have a usable value.
  final String nativeScript;

  factory LessonActivity.fromJson(Map<String, dynamic> json) {
    final phrase = json['phrase'] as String? ?? '';
    return LessonActivity(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Practice',
      prompt: json['prompt'] as String? ?? '',
      phrase: phrase,
      meaning: json['meaning'] as String? ?? '',
      nativeScript: json['native_script'] as String? ?? phrase,
    );
  }
}
