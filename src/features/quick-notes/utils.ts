import type { QuickNote } from '@/src/local/types';

export const allFilter = '全部';

export function splitTags(value: unknown) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function firstNoteTag(note: QuickNote, tags: string[]) {
  return splitTags(note.tags)[0] || tags[0] || '想法';
}
