class ProgressEvent {
  const ProgressEvent({
    required this.eventId,
    required this.profileId,
    required this.deviceId,
    required this.sessionId,
    required this.eventType,
    required this.entityId,
    required this.occurredAt,
    required this.recordedAt,
    required this.clientSequence,
    required this.payload,
    this.schemaVersion = 1,
  });

  factory ProgressEvent.fromJson(Map<String, Object?> json) {
    final payload = json['payload'];

    return ProgressEvent(
      eventId: json['event_id'] as String,
      profileId: json['profile_id'] as String,
      deviceId: json['device_id'] as String,
      sessionId: json['session_id'] as String,
      eventType: json['event_type'] as String,
      entityId: json['entity_id'] as String,
      occurredAt: json['occurred_at'] as String,
      recordedAt: json['recorded_at'] as String,
      clientSequence: json['client_sequence'] as int,
      payload: (payload as Map).cast<String, Object?>(),
      schemaVersion: json['schema_version'] as int,
    );
  }

  factory ProgressEvent.activityCompleted({
    required String profileId,
    required String languageCode,
    required String activityId,
    required int clientSequence,
    DateTime? timestamp,
  }) {
    final now = timestamp ?? DateTime.now();
    final isoNow = now.toIso8601String();

    return ProgressEvent(
      eventId: 'evt_${profileId}_${activityId}_$clientSequence',
      profileId: profileId,
      deviceId: 'flutter_web_dev',
      sessionId: 'session_${profileId}_${languageCode}_starter',
      eventType: 'activity_completed',
      entityId: activityId,
      occurredAt: isoNow,
      recordedAt: isoNow,
      clientSequence: clientSequence,
      payload: const {
        'score': 1.0,
        'attempt_count': 1,
      },
    );
  }

  final String eventId;
  final String profileId;
  final String deviceId;
  final String sessionId;
  final String eventType;
  final String entityId;
  final String occurredAt;
  final String recordedAt;
  final int clientSequence;
  final Map<String, Object?> payload;
  final int schemaVersion;

  Map<String, Object?> toJson() {
    return {
      'event_id': eventId,
      'profile_id': profileId,
      'device_id': deviceId,
      'session_id': sessionId,
      'event_type': eventType,
      'entity_id': entityId,
      'occurred_at': occurredAt,
      'recorded_at': recordedAt,
      'client_sequence': clientSequence,
      'payload': payload,
      'schema_version': schemaVersion,
    };
  }
}
