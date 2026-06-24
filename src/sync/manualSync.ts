import { listNotesForSync, replaceNotesFromSync } from '@/src/local/notesRepository';
import { getSettingsLocal, saveSettingsFromSync } from '@/src/local/settingsRepository';
import { getSyncMetadata, saveSyncMetadata } from '@/src/local/syncMetadataRepository';
import type { NoteSettings, QuickNote } from '@/src/local/types';
import { mergeSyncRecords } from './syncMerge';
import { getCurrentSession, getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

type RemoteNote = {
  id: string;
  user_id: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type RemoteSettings = {
  user_id: string;
  note_tags: string[];
  note_tag_colors: Record<string, string>;
  updated_at: string;
};

export type ManualSyncResult =
  | {
      status: 'signedOut';
    }
  | {
      status: 'synced';
      uploadedNotes: number;
      downloadedNotes: number;
      uploadedSettings: boolean;
      downloadedSettings: boolean;
      syncedAt: string;
    };

function toRemoteNote(note: QuickNote, userId: string): RemoteNote {
  return {
    id: note.id,
    user_id: userId,
    content: note.content,
    tags: note.tags,
    created_at: note.created_at,
    updated_at: note.updated_at,
    deleted_at: note.deleted_at ?? null,
  };
}

function toLocalNote(note: RemoteNote): QuickNote {
  return {
    id: note.id,
    content: note.content,
    tags: note.tags,
    created_at: note.created_at,
    updated_at: note.updated_at,
    deleted_at: note.deleted_at,
    sync_status: 'synced',
  };
}

function settingsTimestamp(settings: Pick<NoteSettings, 'updated_at'> | null | undefined) {
  const time = new Date(settings?.updated_at || '').getTime();
  return Number.isFinite(time) ? time : 0;
}

function toRemoteSettings(settings: NoteSettings, userId: string): RemoteSettings {
  return {
    user_id: userId,
    note_tags: settings.note_tags,
    note_tag_colors: settings.note_tag_colors,
    updated_at: settings.updated_at || new Date().toISOString(),
  };
}

export async function runManualSync(): Promise<ManualSyncResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('还没有配置 Supabase。请设置 EXPO_PUBLIC_SUPABASE_URL 和 EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY。');
  }

  const session = await getCurrentSession();
  if (!session?.user) return { status: 'signedOut' };

  const supabase = getSupabaseClient();
  const userId = session.user.id;
  const syncedAt = new Date().toISOString();
  const [localNotes, localSettings] = await Promise.all([listNotesForSync(), getSettingsLocal()]);
  const pendingNotes = localNotes.filter((note) => note.sync_status === 'pending' || note.sync_status === 'failed');

  if (pendingNotes.length > 0) {
    const { error } = await supabase
      .from('quick_notes')
      .upsert(pendingNotes.map((note) => toRemoteNote(note, userId)), { onConflict: 'id' });
    if (error) throw error;
  }

  const { data: remoteNotesData, error: remoteNotesError } = await supabase
    .from('quick_notes')
    .select('id,user_id,content,tags,created_at,updated_at,deleted_at')
    .eq('user_id', userId);
  if (remoteNotesError) throw remoteNotesError;

  const remoteNotes = ((remoteNotesData ?? []) as RemoteNote[]).map(toLocalNote);
  const mergedNotes = mergeSyncRecords(
    localNotes.map((note) => ({ ...note, sync_status: pendingNotes.some((pending) => pending.id === note.id) ? 'synced' as const : note.sync_status })),
    remoteNotes
  ).map((note) => ({ ...note, sync_status: 'synced' as const }));

  await replaceNotesFromSync(mergedNotes);

  const { data: remoteSettingsData, error: remoteSettingsError } = await supabase
    .from('note_settings')
    .select('user_id,note_tags,note_tag_colors,updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (remoteSettingsError) throw remoteSettingsError;

  const remoteSettings = remoteSettingsData as RemoteSettings | null;
  const shouldUploadSettings = localSettings.sync_status === 'pending' || localSettings.sync_status === 'failed' || !remoteSettings;
  let uploadedSettings = false;

  if (shouldUploadSettings) {
    const { error } = await supabase
      .from('note_settings')
      .upsert(toRemoteSettings(localSettings, userId), { onConflict: 'user_id' });
    if (error) throw error;
    uploadedSettings = true;
  }

  const { data: nextRemoteSettingsData, error: nextRemoteSettingsError } = await supabase
    .from('note_settings')
    .select('user_id,note_tags,note_tag_colors,updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (nextRemoteSettingsError) throw nextRemoteSettingsError;

  const nextRemoteSettings = nextRemoteSettingsData as RemoteSettings | null;
  const downloadedSettings = Boolean(nextRemoteSettings && settingsTimestamp(nextRemoteSettings) > settingsTimestamp(localSettings));
  if (nextRemoteSettings && settingsTimestamp(nextRemoteSettings) >= settingsTimestamp(localSettings)) {
    await saveSettingsFromSync({
      note_tags: nextRemoteSettings.note_tags,
      note_tag_colors: nextRemoteSettings.note_tag_colors,
      updated_at: nextRemoteSettings.updated_at,
      sync_status: 'synced',
    });
  } else {
    await saveSettingsFromSync(localSettings);
  }

  await saveSyncMetadata({ ...(await getSyncMetadata()), last_synced_at: syncedAt });

  return {
    status: 'synced',
    uploadedNotes: pendingNotes.length,
    downloadedNotes: remoteNotes.length,
    uploadedSettings,
    downloadedSettings,
    syncedAt,
  };
}
