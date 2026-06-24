create table if not exists public.quick_notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  tags text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists quick_notes_user_updated_idx
  on public.quick_notes (user_id, updated_at desc);

alter table public.quick_notes enable row level security;

grant select, insert, update, delete on table public.quick_notes to authenticated;

drop policy if exists "quick notes are user owned" on public.quick_notes;
create policy "quick notes are user owned"
  on public.quick_notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.note_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note_tags jsonb not null default '[]'::jsonb,
  note_tag_colors jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null
);

alter table public.note_settings enable row level security;

grant select, insert, update, delete on table public.note_settings to authenticated;

drop policy if exists "note settings are user owned" on public.note_settings;
create policy "note settings are user owned"
  on public.note_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
