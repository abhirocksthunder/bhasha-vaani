import 'package:bhasha_vaani/features/progress/domain/progress_event.dart';
import 'package:bhasha_vaani/features/progress/domain/progress_outbox_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('enqueue persists events and ignores duplicate event ids', () async {
    const repository = ProgressOutboxRepository();
    final event = ProgressEvent.activityCompleted(
      profileId: 'profile_abhilash',
      languageCode: 'kn',
      activityId: 'kn_a1_lesson_01_activity_01',
      clientSequence: 1,
      timestamp: DateTime.parse('2026-07-31T19:00:00+05:30'),
    );

    await repository.enqueue(event);
    await repository.enqueue(event);

    final queuedEvents = await repository.fetchQueuedEvents();

    expect(await repository.queuedCount(), 1);
    expect(queuedEvents.single.eventId, event.eventId);
  });

  test('replaceAll stores only remaining failed events', () async {
    const repository = ProgressOutboxRepository();
    final first = ProgressEvent.activityCompleted(
      profileId: 'profile_abhilash',
      languageCode: 'kn',
      activityId: 'first',
      clientSequence: 1,
      timestamp: DateTime.parse('2026-07-31T19:00:00+05:30'),
    );
    final second = ProgressEvent.activityCompleted(
      profileId: 'profile_abhilash',
      languageCode: 'kn',
      activityId: 'second',
      clientSequence: 2,
      timestamp: DateTime.parse('2026-07-31T19:01:00+05:30'),
    );

    await repository.enqueue(first);
    await repository.enqueue(second);
    await repository.replaceAll([second]);

    final queuedEvents = await repository.fetchQueuedEvents();

    expect(queuedEvents.length, 1);
    expect(queuedEvents.single.eventId, second.eventId);
  });
}
