import 'package:bhasha_vaani/features/progress/domain/progress_event.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('activityCompleted serializes the progress event envelope', () {
    final event = ProgressEvent.activityCompleted(
      profileId: 'profile_abhilash',
      languageCode: 'kn',
      activityId: 'kn_a1_lesson_01_activity_01',
      clientSequence: 7,
      timestamp: DateTime.parse('2026-07-31T18:30:00+05:30'),
    );

    final json = event.toJson();

    expect(json['event_id'], 'evt_profile_abhilash_kn_a1_lesson_01_activity_01_7');
    expect(json['profile_id'], 'profile_abhilash');
    expect(json['device_id'], 'flutter_web_dev');
    expect(json['session_id'], 'session_profile_abhilash_kn_starter');
    expect(json['event_type'], 'activity_completed');
    expect(json['entity_id'], 'kn_a1_lesson_01_activity_01');
    expect(json['client_sequence'], 7);
    expect(json['schema_version'], 1);
    expect(json['payload'], isA<Map<String, Object?>>());
  });
}
