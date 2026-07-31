import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'progress_event.dart';

class ProgressOutboxRepository {
  const ProgressOutboxRepository({
    this.preferencesProvider = SharedPreferences.getInstance,
  });

  static const _eventsKey = 'bhasha_vaani.progress_outbox.events.v1';

  final Future<SharedPreferences> Function() preferencesProvider;

  Future<List<ProgressEvent>> fetchQueuedEvents() async {
    final preferences = await preferencesProvider();
    final rows = preferences.getStringList(_eventsKey) ?? const [];

    return rows
        .map((row) => jsonDecode(row) as Map<String, dynamic>)
        .map((json) => ProgressEvent.fromJson(json.cast<String, Object?>()))
        .toList(growable: false);
  }

  Future<int> queuedCount() async {
    final preferences = await preferencesProvider();
    return preferences.getStringList(_eventsKey)?.length ?? 0;
  }

  Future<void> enqueue(ProgressEvent event) async {
    final preferences = await preferencesProvider();
    final rows = preferences.getStringList(_eventsKey) ?? <String>[];
    final eventJson = jsonEncode(event.toJson());
    final existingEventIds = rows
        .map((row) => jsonDecode(row) as Map<String, dynamic>)
        .map((json) => json['event_id'] as String)
        .toSet();

    if (!existingEventIds.contains(event.eventId)) {
      rows.add(eventJson);
      await preferences.setStringList(_eventsKey, rows);
    }
  }

  Future<void> replaceAll(List<ProgressEvent> events) async {
    final preferences = await preferencesProvider();
    await preferences.setStringList(
      _eventsKey,
      events.map((event) => jsonEncode(event.toJson())).toList(growable: false),
    );
  }

  Future<void> clear() async {
    final preferences = await preferencesProvider();
    await preferences.remove(_eventsKey);
  }
}
