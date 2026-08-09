class LearnedWord {
  const LearnedWord({
    required this.activityId,
    required this.title,
    required this.phrase,
    required this.nativeScript,
    required this.meaning,
    required this.languageCode,
    required this.completedAt,
  });

  final String activityId;
  final String title;
  final String phrase;
  final String nativeScript;
  final String meaning;
  final String languageCode;

  /// ISO-8601 timestamp string from the backend (occurred_at). Kept as a
  /// raw string plus a parsed [completedAtLocal] getter so a malformed
  /// timestamp never crashes the list -- it just falls back to showing
  /// nothing for the date.
  final String completedAt;

  DateTime? get completedAtLocal {
    try {
      return DateTime.parse(completedAt).toLocal();
    } catch (_) {
      return null;
    }
  }

  factory LearnedWord.fromJson(Map<String, dynamic> json) {
    final phrase = json['phrase'] as String? ?? '';
    return LearnedWord(
      activityId: json['activity_id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      phrase: phrase,
      nativeScript: json['native_script'] as String? ?? phrase,
      meaning: json['meaning'] as String? ?? '',
      languageCode: json['language_code'] as String? ?? '',
      completedAt: json['completed_at'] as String? ?? '',
    );
  }
}
