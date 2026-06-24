# Manual Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add account login and user-triggered note/category sync while preserving local-first quick note editing.

**Architecture:** Keep the screens calling repository functions. Rework local data into sync-aware records, then add Supabase auth and one explicit `runManualSync()` operation that uploads pending local changes and downloads remote changes. No automatic background sync, realtime subscriptions, or collaborative conflict UI in this version.

**Tech Stack:** Expo Router, React Native, AsyncStorage-backed local repository, Supabase Auth/Postgres, TypeScript tests through `tsx`.

---

### Task 1: Sync Model Tests

**Files:**
- Modify: `scripts/test-local-repositories.ts`
- Create: `src/sync/syncMerge.ts`

- [ ] Add tests for newest-update-wins, delete-wins, and pull-after-upload merge behavior.
- [ ] Run `npm run test:local` and confirm the new tests fail because sync helpers do not exist.
- [ ] Implement pure merge helpers in `src/sync/syncMerge.ts`.
- [ ] Run `npm run test:local` and confirm the sync tests pass.

### Task 2: Local Sync-Aware Repository

**Files:**
- Modify: `src/local/types.ts`
- Modify: `src/local/notesRepository.ts`
- Modify: `src/local/settingsRepository.ts`

- [ ] Add UUID string ids, `deleted_at`, and `sync_status`.
- [ ] Keep repository function names stable for the UI.
- [ ] Hide soft-deleted records from normal lists.
- [ ] Mark creates, edits, deletes, and settings changes as `pending`.
- [ ] Preserve migration from existing numeric-id AsyncStorage data.

### Task 3: Supabase Client and Manual Sync

**Files:**
- Create: `src/sync/supabaseClient.ts`
- Create: `src/sync/manualSync.ts`
- Create: `docs/supabase-schema.sql`

- [ ] Initialize Supabase from `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Return a clear configuration error when env vars are missing.
- [ ] Upload pending notes/settings for the signed-in user.
- [ ] Pull remote rows changed after the last sync timestamp.
- [ ] Store sync metadata locally only after all operations finish.

### Task 4: Auth and UI

**Files:**
- Create: `app/auth.tsx`
- Create: `src/features/auth/AuthScreen.tsx`
- Modify: `src/features/quick-notes/QuickNoteScreen.tsx`
- Modify: `src/shared/replicated.tsx`

- [ ] Add a top-right manual sync icon on the quick note screen.
- [ ] If the user is signed out, route to the auth screen.
- [ ] If signed in, run manual sync and show completion/failure feedback.
- [ ] Add email/password sign up and sign in.

### Task 5: Verification

**Commands:**
- `npm run test:local`
- `npx tsc --noEmit`
- `npm run lint`

- [ ] Fix failures without weakening the tests.
- [ ] Confirm the app still opens without Supabase env vars.
