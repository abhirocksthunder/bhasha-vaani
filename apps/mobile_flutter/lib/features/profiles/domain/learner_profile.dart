enum ProfileType {
  adult,
  child,
}

class LearnerProfile {
  const LearnerProfile({
    required this.id,
    required this.displayName,
    required this.type,
    required this.ageGroup,
    required this.explanationLanguage,
    required this.sessionMinutes,
  });

  final String id;
  final String displayName;
  final ProfileType type;
  final String ageGroup;
  final String explanationLanguage;
  final int sessionMinutes;

  Map<String, Object?> toJson() {
    return {
      'id': id,
      'display_name': displayName,
      'type': isChild ? 'child' : 'adult',
      'age_group': ageGroup,
      'explanation_language': explanationLanguage,
      'session_minutes': sessionMinutes,
    };
  }

  LearnerProfile copyWith({
    String? displayName,
    String? explanationLanguage,
    int? sessionMinutes,
  }) {
    return LearnerProfile(
      id: id,
      displayName: displayName ?? this.displayName,
      type: type,
      ageGroup: ageGroup,
      explanationLanguage: explanationLanguage ?? this.explanationLanguage,
      sessionMinutes: sessionMinutes ?? this.sessionMinutes,
    );
  }

  factory LearnerProfile.fromJson(Map<String, dynamic> json) {
    final typeValue = json['type'] as String? ?? 'adult';

    return LearnerProfile(
      id: json['id'] as String,
      displayName: json['display_name'] as String,
      type: typeValue == 'child' ? ProfileType.child : ProfileType.adult,
      ageGroup: json['age_group'] as String,
      explanationLanguage: json['explanation_language'] as String,
      sessionMinutes: json['session_minutes'] as int,
    );
  }

  bool get isChild => type == ProfileType.child;

  String get typeLabel => switch (type) {
        ProfileType.adult => 'Adult',
        ProfileType.child => 'Child',
      };
}
