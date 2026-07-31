class ProgressSummary {
  const ProgressSummary({
    required this.profileName,
    required this.languageName,
    required this.completedActivities,
    required this.pendingReviews,
    required this.currentLesson,
    required this.syncState,
  });

  factory ProgressSummary.seed({
    required String profileName,
    required String languageName,
  }) {
    return ProgressSummary(
      profileName: profileName,
      languageName: languageName,
      completedActivities: 2,
      pendingReviews: 6,
      currentLesson: 'Starter lesson 1',
      syncState: 'Local-first demo',
    );
  }

  factory ProgressSummary.fromJson({
    required String profileName,
    required String languageName,
    required Map<String, dynamic> json,
  }) {
    return ProgressSummary(
      profileName: profileName,
      languageName: languageName,
      completedActivities: json['completed_activities'] as int? ?? 0,
      pendingReviews: json['pending_reviews'] as int? ?? 0,
      currentLesson: json['current_lesson'] as String? ?? 'Starter lesson 1',
      syncState: json['sync_state'] as String? ?? 'Server projection',
    );
  }

  final String profileName;
  final String languageName;
  final int completedActivities;
  final int pendingReviews;
  final String currentLesson;
  final String syncState;
}
