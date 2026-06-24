export type QuickNote = {
  id: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status?: SyncStatus;
};

export type NoteSettings = {
  note_tags: string[];
  note_tag_colors: Record<string, string>;
  updated_at?: string;
  sync_status?: SyncStatus;
};

export type NotePayload = {
  content: string;
  tags: string;
};

export type SyncStatus = 'pending' | 'synced' | 'failed';
