import { clearNotesLocal, listNotesLocal } from './notesRepository';
import { getSettingsLocal, resetSettingsLocal } from './settingsRepository';
import { clearSyncMetadata, getSyncMetadata, type SyncMetadata } from './syncMetadataRepository';
import type { NoteSettings, QuickNote } from './types';

export type LocalMergeSummary = {
  shouldConfirm: boolean;
  noteCount: number;
  hasSettingsChanges: boolean;
};

export function buildLocalMergeSummary(
  notes: QuickNote[],
  settings: NoteSettings,
  metadata: SyncMetadata
): LocalMergeSummary {
  const noteCount = notes.filter((note) => !note.deleted_at).length;
  const hasSettingsChanges = settings.sync_status === 'pending' || settings.sync_status === 'failed';
  return {
    shouldConfirm: !metadata.last_synced_at && (noteCount > 0 || hasSettingsChanges),
    noteCount,
    hasSettingsChanges,
  };
}

export async function getLocalMergeSummary() {
  const [notes, settings, metadata] = await Promise.all([listNotesLocal(), getSettingsLocal(), getSyncMetadata()]);
  return buildLocalMergeSummary(notes, settings, metadata);
}

export async function clearAccountLocalData() {
  const [, settings, metadata] = await Promise.all([
    clearNotesLocal(),
    resetSettingsLocal(),
    clearSyncMetadata(),
  ]);
  return { settings, metadata };
}
