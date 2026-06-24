import assert from 'node:assert/strict';

import {
  createNoteInList,
  deleteNoteFromList,
  sortQuickNotesNewest,
  updateNoteInList,
} from '../src/local/notesRepository';
import { defaultNoteSettings, normalizeNoteSettings } from '../src/local/settingsRepository';
import { SETTINGS_PRESET_COLORS } from '../src/features/settings/tagColors';
import { mergeSyncRecords } from '../src/sync/syncMerge';
import { buildLocalMergeSummary } from '../src/local/localDataRepository';

const baseNotes = [
  { id: '1', content: 'old', tags: '想法', created_at: '2026-01-01T08:00:00.000Z', updated_at: '2026-01-01T08:00:00.000Z', deleted_at: null },
  { id: '2', content: 'new', tags: '待办', created_at: '2026-01-03T08:00:00.000Z', updated_at: '2026-01-03T08:00:00.000Z', deleted_at: null },
  { id: '3', content: 'middle', tags: '随记', created_at: '2026-01-02T08:00:00.000Z', updated_at: '2026-01-02T08:00:00.000Z', deleted_at: null },
];

assert.deepEqual(sortQuickNotesNewest(baseNotes).map((note) => note.id), ['2', '3', '1']);

const created = createNoteInList(baseNotes, {
  content: 'created',
  tags: '重要',
  now: '2026-01-04T08:00:00.000Z',
  id: 'created-id',
});
assert.equal(created.note.id, 'created-id');
assert.equal(created.note.content, 'created');
assert.equal(created.note.tags, '重要');
assert.equal(created.note.deleted_at, null);
assert.equal(created.note.sync_status, 'pending');
assert.deepEqual(created.notes.map((note) => note.id), ['created-id', '2', '3', '1']);

const updated = updateNoteInList(created.notes, '3', {
  content: 'updated middle',
  tags: '摘录',
  now: '2026-01-05T08:00:00.000Z',
});
assert.ok(updated.note);
const updatedNote = updated.note;
assert.equal(updatedNote.id, '3');
assert.equal(updatedNote.content, 'updated middle');
assert.equal(updatedNote.tags, '摘录');
assert.equal(updatedNote.created_at, '2026-01-02T08:00:00.000Z');
assert.equal(updatedNote.updated_at, '2026-01-05T08:00:00.000Z');
assert.equal(updatedNote.sync_status, 'pending');

const deleted = deleteNoteFromList(updated.notes, '2', '2026-01-06T08:00:00.000Z');
const softDeletedNote = deleted.find((note) => note.id === '2');
assert.equal(softDeletedNote?.deleted_at, '2026-01-06T08:00:00.000Z');
assert.equal(softDeletedNote?.sync_status, 'pending');

assert.deepEqual(defaultNoteSettings.note_tags, ['想法', '随记', '待办', '重要', '摘录']);
assert.deepEqual(normalizeNoteSettings({ note_tags: [] }).note_tags, defaultNoteSettings.note_tags);
const normalizedSettings = normalizeNoteSettings({ note_tags: ['灵感'], note_tag_colors: { 灵感: '#E03131' } });
assert.deepEqual(normalizedSettings.note_tags, ['灵感']);
assert.deepEqual(normalizedSettings.note_tag_colors, { 灵感: '#E03131' });
assert.equal(normalizedSettings.sync_status, 'pending');

assert.equal(SETTINGS_PRESET_COLORS.length, 48);
assert.deepEqual(SETTINGS_PRESET_COLORS.slice(0, 4), ['#E03131', '#C92A2A', '#F03E3E', '#FF6B6B']);
assert.deepEqual(SETTINGS_PRESET_COLORS.slice(-4), ['#556B2F', '#795548', '#A16207', '#BC8F8F']);

const mergedNewerRemote = mergeSyncRecords(
  [
    {
      id: 'note-a',
      content: 'local',
      tags: '想法',
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-01-02T08:00:00.000Z',
      deleted_at: null,
    },
  ],
  [
    {
      id: 'note-a',
      content: 'remote',
      tags: '随记',
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-01-03T08:00:00.000Z',
      deleted_at: null,
    },
  ]
);
assert.equal(mergedNewerRemote[0].content, 'remote');
assert.equal(mergedNewerRemote[0].tags, '随记');

const mergedDeleteWins = mergeSyncRecords(
  [
    {
      id: 'note-b',
      content: 'deleted local',
      tags: '想法',
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-01-04T08:00:00.000Z',
      deleted_at: '2026-01-04T08:00:00.000Z',
    },
  ],
  [
    {
      id: 'note-b',
      content: 'older remote edit',
      tags: '重要',
      created_at: '2026-01-01T08:00:00.000Z',
      updated_at: '2026-01-03T08:00:00.000Z',
      deleted_at: null,
    },
  ]
);
assert.equal(mergedDeleteWins[0].deleted_at, '2026-01-04T08:00:00.000Z');

const mergedSorted = mergeSyncRecords(
  [
    {
      id: 'note-c',
      content: 'local only',
      tags: '想法',
      created_at: '2026-01-03T08:00:00.000Z',
      updated_at: '2026-01-03T08:00:00.000Z',
      deleted_at: null,
    },
  ],
  [
    {
      id: 'note-d',
      content: 'remote only',
      tags: '随记',
      created_at: '2026-01-04T08:00:00.000Z',
      updated_at: '2026-01-04T08:00:00.000Z',
      deleted_at: null,
    },
  ]
);
assert.deepEqual(mergedSorted.map((note) => note.id), ['note-d', 'note-c']);

const localMergeNote = {
  id: 'local-note',
  content: 'local',
  tags: '想法',
  created_at: '2026-01-01T08:00:00.000Z',
  updated_at: '2026-01-01T08:00:00.000Z',
  deleted_at: null,
  sync_status: 'pending' as const,
};

assert.deepEqual(
  buildLocalMergeSummary([localMergeNote], defaultNoteSettings, { last_synced_at: null }),
  { shouldConfirm: true, noteCount: 1, hasSettingsChanges: false }
);
assert.deepEqual(
  buildLocalMergeSummary([localMergeNote], defaultNoteSettings, { last_synced_at: '2026-01-02T08:00:00.000Z' }),
  { shouldConfirm: false, noteCount: 1, hasSettingsChanges: false }
);
assert.deepEqual(
  buildLocalMergeSummary([], { ...defaultNoteSettings, sync_status: 'pending' }, { last_synced_at: null }),
  { shouldConfirm: true, noteCount: 0, hasSettingsChanges: true }
);

console.log('local repository tests passed');
