import { getJson, setJson } from './storage';
import type { NotePayload, QuickNote } from './types';

const notesKey = 'notes.items';

function timestamp(value: string | null | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function normalizePayload(payload: NotePayload) {
  return {
    content: payload.content.trim(),
    tags: payload.tags.trim(),
  };
}

function createLocalId() {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) return randomId;
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeNote(value: Partial<QuickNote> & { id?: string | number } | null | undefined): QuickNote | null {
  if (!value) return null;
  const now = new Date().toISOString();
  const id = value.id == null || value.id === '' ? createLocalId() : String(value.id);
  return {
    id,
    content: typeof value.content === 'string' ? value.content : '',
    tags: typeof value.tags === 'string' ? value.tags : '',
    created_at: typeof value.created_at === 'string' ? value.created_at : now,
    updated_at: typeof value.updated_at === 'string' ? value.updated_at : typeof value.created_at === 'string' ? value.created_at : now,
    deleted_at: typeof value.deleted_at === 'string' ? value.deleted_at : null,
    sync_status: value.sync_status ?? 'pending',
  };
}

function normalizeNotes(values: unknown): QuickNote[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => normalizeNote(value as Partial<QuickNote>)).filter((note): note is QuickNote => Boolean(note));
}

export function sortQuickNotesNewest<T extends Pick<QuickNote, 'id' | 'created_at' | 'updated_at'>>(items: T[]) {
  return [...items].sort((a, b) => {
    const timeDiff = (timestamp(b.created_at) || timestamp(b.updated_at))
      - (timestamp(a.created_at) || timestamp(a.updated_at));
    if (timeDiff !== 0) return timeDiff;
    return String(b.id || '').localeCompare(String(a.id || ''));
  });
}

export function createNoteInList(notes: QuickNote[], payload: NotePayload & { id?: string; now?: string }): { note: QuickNote; notes: QuickNote[] } {
  const now = payload.now || new Date().toISOString();
  const normalized = normalizePayload(payload);
  const note: QuickNote = {
    id: payload.id || createLocalId(),
    content: normalized.content,
    tags: normalized.tags,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    sync_status: 'pending',
  };
  return {
    note,
    notes: sortQuickNotesNewest([note, ...notes]),
  };
}

export function updateNoteInList(notes: QuickNote[], id: string, payload: NotePayload & { now?: string }): { note: QuickNote | null; notes: QuickNote[] } {
  const now = payload.now || new Date().toISOString();
  const normalized = normalizePayload(payload);
  let updatedNote: QuickNote | null = null;
  const nextNotes = notes.map((note) => {
    if (note.id !== id) return note;
    updatedNote = {
      ...note,
      content: normalized.content,
      tags: normalized.tags,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending',
    };
    return updatedNote;
  });
  return {
    note: updatedNote,
    notes: sortQuickNotesNewest(nextNotes),
  };
}

export function deleteNoteFromList(notes: QuickNote[], id: string, now = new Date().toISOString()): QuickNote[] {
  return sortQuickNotesNewest(notes.map((note) => {
    if (note.id !== id) return note;
    return {
      ...note,
      updated_at: now,
      deleted_at: now,
      sync_status: 'pending',
    };
  }));
}

export async function listNotesLocal() {
  const notes = normalizeNotes(await getJson<QuickNote[]>(notesKey, []));
  return sortQuickNotesNewest(notes.filter((note) => !note.deleted_at));
}

export async function listNotesForSync() {
  return sortQuickNotesNewest(normalizeNotes(await getJson<QuickNote[]>(notesKey, [])));
}

export async function replaceNotesFromSync(notes: QuickNote[]) {
  const normalized = sortQuickNotesNewest(notes.map((note) => ({
    ...note,
    id: String(note.id),
    deleted_at: note.deleted_at ?? null,
    sync_status: 'synced' as const,
  })));
  await setJson(notesKey, normalized);
  return normalized;
}

export async function clearNotesLocal() {
  await setJson(notesKey, []);
  return [];
}

export async function markNotesSynced(ids: string[]) {
  const idSet = new Set(ids);
  const notes = (await listNotesForSync()).map((note) => (idSet.has(note.id) ? { ...note, sync_status: 'synced' as const } : note));
  await setJson(notesKey, notes);
  return notes;
}

export async function createNoteLocal(payload: NotePayload) {
  const current = await listNotesForSync();
  const result = createNoteInList(current, payload);
  await setJson(notesKey, result.notes);
  return result.note;
}

export async function updateNoteLocal(id: string, payload: NotePayload) {
  const current = await listNotesForSync();
  const result = updateNoteInList(current, id, payload);
  await setJson(notesKey, result.notes);
  return result.note;
}

export async function deleteNoteLocal(id: string) {
  const current = await listNotesForSync();
  const nextNotes = deleteNoteFromList(current, id);
  await setJson(notesKey, nextNotes);
}
