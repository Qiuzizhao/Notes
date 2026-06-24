import { getJson, setJson } from './storage';
import type { NoteSettings } from './types';

const settingsKey = 'notes.settings';

export const defaultNoteSettings: NoteSettings = {
  note_tags: ['想法', '随记', '待办', '重要', '摘录'],
  note_tag_colors: {},
  updated_at: '2026-01-01T00:00:00.000Z',
  sync_status: 'synced',
};

export function getDefaultNoteSettings(): NoteSettings {
  return {
    ...defaultNoteSettings,
    note_tags: [...defaultNoteSettings.note_tags],
    note_tag_colors: { ...defaultNoteSettings.note_tag_colors },
  };
}

export function normalizeNoteSettings(value: Partial<NoteSettings> | null | undefined): NoteSettings {
  const noteTags = Array.isArray(value?.note_tags) && value.note_tags.length
    ? value.note_tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0).map((tag) => tag.trim())
    : getDefaultNoteSettings().note_tags;

  return {
    note_tags: noteTags.length ? noteTags : getDefaultNoteSettings().note_tags,
    note_tag_colors: value?.note_tag_colors && typeof value.note_tag_colors === 'object'
      ? { ...value.note_tag_colors }
      : {},
    updated_at: typeof value?.updated_at === 'string' ? value.updated_at : defaultNoteSettings.updated_at,
    sync_status: value?.sync_status ?? 'pending',
  };
}

export async function getSettingsLocal() {
  return normalizeNoteSettings(await getJson<Partial<NoteSettings>>(settingsKey, getDefaultNoteSettings()));
}

export async function saveSettingsLocal(settings: NoteSettings) {
  const nextSettings = {
    ...normalizeNoteSettings(settings),
    updated_at: new Date().toISOString(),
    sync_status: 'pending' as const,
  };
  await setJson(settingsKey, nextSettings);
  return nextSettings;
}

export async function saveSettingsFromSync(settings: NoteSettings) {
  const nextSettings = {
    ...normalizeNoteSettings(settings),
    sync_status: 'synced' as const,
  };
  await setJson(settingsKey, nextSettings);
  return nextSettings;
}

export async function resetSettingsLocal() {
  const nextSettings = getDefaultNoteSettings();
  await setJson(settingsKey, nextSettings);
  return nextSettings;
}
