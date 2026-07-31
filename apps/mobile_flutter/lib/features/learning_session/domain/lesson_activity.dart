class LessonActivity {
  const LessonActivity({
    required this.id,
    required this.title,
    required this.prompt,
    required this.phrase,
    required this.meaning,
  });

  final String id;
  final String title;
  final String prompt;
  final String phrase;
  final String meaning;

  factory LessonActivity.fromJson(Map<String, dynamic> json) {
    return LessonActivity(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Practice',
      prompt: json['prompt'] as String? ?? '',
      phrase: json['phrase'] as String? ?? '',
      meaning: json['meaning'] as String? ?? '',
    );
  }
}
