# Notes Quick Note App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Expo React Native app that contains only the SuperMe quick-note page plus quick-note category settings.

**Architecture:** Create a minimal Expo Router app in `/Volumes/Data/Projects/Notes`. Copy the visual interaction model from `SuperMe-APP`, but replace remote sync and preload behavior with small AsyncStorage repositories.

**Tech Stack:** Expo SDK 54, Expo Router, React Native, TypeScript, AsyncStorage, Gorhom Bottom Sheet, Expo Blur, Expo Haptics, Ionicons.

---

## File Structure

- Create `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `eslint.config.js`, `.gitignore`: Expo project configuration.
- Create `app/_layout.tsx`: app providers and stack routes.
- Create `app/index.tsx`: quick-note root route.
- Create `app/settings.tsx`: quick-note category settings route.
- Create `src/local/types.ts`: shared `QuickNote` and `NoteSettings` types.
- Create `src/local/storage.ts`: AsyncStorage JSON helpers.
- Create `src/local/notesRepository.ts`: CRUD functions for local notes.
- Create `src/local/settingsRepository.ts`: local category settings functions.
- Create `src/shared/theme.ts`: copied color, radius, spacing, shadow, theme helpers.
- Create `src/shared/components.tsx`: `Screen`, `Header`, `IconButton`, `PrimaryButton`, `StateView`, `FormSheet`, `SheetTextInput`.
- Create `src/shared/replicated.tsx`: `ScreenShell`, `TextArea`, `compactDateTime`, `safeNoteText`, `confirmRemove`.
- Create `src/shared/color.ts`: `colorWithAlpha`.
- Create `src/features/settings/tagColors.ts`: default categories and tag color helpers.
- Create `src/features/settings/NoteTagEditor.tsx`: category management UI.
- Create `src/features/settings/SettingsScreen.tsx`: settings route UI and persistence logic.
- Create `src/features/settings/styles.ts`: settings styles used by the editor.
- Create `src/features/quick-notes/utils.ts`: sort and tag parsing helpers.
- Create `src/features/quick-notes/styles.ts`: quick-note styles.
- Create `src/features/quick-notes/QuickNoteScreen.tsx`: extracted quick-note page.
- Create `scripts/test-local-repositories.mjs`: local unit check for note sorting and settings defaults.

## Tasks

### Task 1: Project Skeleton

**Files:**
- Create: project config files
- Create: `app/_layout.tsx`, `app/index.tsx`, `app/settings.tsx`

- [ ] Create the Expo Router project files with the dependencies required by the extracted quick-note feature.
- [ ] Configure `@/*` TypeScript path alias.
- [ ] Add routes so `/` opens quick notes and `/settings` opens category settings.
- [ ] Run `npm install`.

### Task 2: Local Data Layer

**Files:**
- Create: `src/local/types.ts`
- Create: `src/local/storage.ts`
- Create: `src/local/notesRepository.ts`
- Create: `src/local/settingsRepository.ts`
- Create: `scripts/test-local-repositories.mjs`

- [ ] Write the repository test script first. It should prove notes sort newest first, update preserves IDs, delete removes notes, and default settings include `想法`, `随记`, `待办`, `重要`, `摘录`.
- [ ] Run the test and verify it fails before the repository exists.
- [ ] Implement AsyncStorage-backed repositories.
- [ ] Run the test and verify it passes.

### Task 3: Shared UI and Theme

**Files:**
- Create: `src/shared/theme.ts`
- Create: `src/shared/components.tsx`
- Create: `src/shared/replicated.tsx`
- Create: `src/shared/color.ts`

- [ ] Copy only the shared components needed by quick notes and settings.
- [ ] Keep the original header height, card radius, shadow, surface colors, bottom sheet, and text area behavior.
- [ ] Remove remote API, preload, and unrelated module helpers.

### Task 4: Settings Screen

**Files:**
- Create: `src/features/settings/tagColors.ts`
- Create: `src/features/settings/NoteTagEditor.tsx`
- Create: `src/features/settings/SettingsScreen.tsx`
- Create: `src/features/settings/styles.ts`
- Modify: `app/settings.tsx`

- [ ] Extract the original `NoteTagEditor` visual structure.
- [ ] Persist category additions, removals, and color changes locally.
- [ ] Use header right action `编辑` / `完成`.
- [ ] Keep the screen limited to quick-note categories.

### Task 5: Quick Note Screen

**Files:**
- Create: `src/features/quick-notes/utils.ts`
- Create: `src/features/quick-notes/styles.ts`
- Create: `src/features/quick-notes/QuickNoteScreen.tsx`
- Modify: `app/index.tsx`

- [ ] Extract the quick-note page layout.
- [ ] Put the settings button in the top-left title-bar action.
- [ ] Preserve tag filter pills, two-column cards, floating add button, glass preview animation, long-press edit, bottom sheet editor, and haptics.
- [ ] Use only local note and settings repositories.
- [ ] Refresh notes and categories when returning from settings.

### Task 6: Verification

**Files:**
- Modify only if verification exposes defects.

- [ ] Run `node scripts/test-local-repositories.mjs`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run lint`.
- [ ] Start with `npx expo start`.
- [ ] Verify in Expo Web or Expo Go that `/` opens `简笔`, the top-left settings button opens `简笔类别`, local notes survive refresh, category colors affect cards and filters, and no sync UI appears.
