import { progressEventFromJson, progressEventToJson, type ProgressEvent } from './types';

// Mirrors apps/mobile_flutter/lib/features/progress/domain/progress_outbox_repository.dart,
// using localStorage instead of shared_preferences -- same simple
// synchronous key-value persistence model, just the browser's version.
// (IndexedDB was considered but is unwarranted complexity for what is
// still just "a small JSON array behind one key.")
const EVENTS_KEY = 'bhasha_vaani.progress_outbox.events.v1';

function readRows(): string[] {
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeRows(rows: string[]): void {
  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(rows));
}

export class ProgressOutboxRepository {
  async fetchQueuedEvents(): Promise<ProgressEvent[]> {
    return readRows()
      .map((row) => JSON.parse(row) as Record<string, unknown>)
      .map(progressEventFromJson);
  }

  async queuedCount(): Promise<number> {
    return readRows().length;
  }

  async enqueue(event: ProgressEvent): Promise<void> {
    const rows = readRows();
    const existingEventIds = new Set(
      rows.map((row) => (JSON.parse(row) as Record<string, unknown>).event_id as string),
    );
    if (!existingEventIds.has(event.eventId)) {
      rows.push(JSON.stringify(progressEventToJson(event)));
      writeRows(rows);
    }
  }

  async replaceAll(events: ProgressEvent[]): Promise<void> {
    writeRows(events.map((event) => JSON.stringify(progressEventToJson(event))));
  }

  async clear(): Promise<void> {
    window.localStorage.removeItem(EVENTS_KEY);
  }
}
