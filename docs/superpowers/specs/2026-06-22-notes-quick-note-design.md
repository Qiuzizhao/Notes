# Notes Quick Note App Design

## Scope

Build a standalone Expo React Native app in `/Volumes/Data/Projects/Notes` that contains only the SuperMe quick-note experience. The original `SuperMe-APP` is a read-only source for layout, animation, and interaction patterns.

The app has no server sync, no account surface, no workbench, no tabs, and no other SuperMe modules.

## Screens

### Quick Notes

The root screen is the quick-note page.

- Title: `简笔`
- Top-left title-bar action: settings button, leading to quick-note category settings
- Tag filter row: horizontal pills with `全部` plus configured note categories
- Content: two-column note cards, preserving the original card proportions, colors, tag badge, date text, and spacing
- Preview: tapping a note animates from the card position into the same glass preview panel
- Editing: long-press opens the note editor sheet
- Creation: bottom-right floating add button opens the same editor sheet
- Editor: multiline note text plus category picker, with add/save/delete behavior matching the original quick-note page

### Settings

The settings screen only manages quick-note categories.

- Title: `简笔类别`
- Category cards keep the original `NoteTagEditor` layout
- Non-editing mode: tap a category to choose its color
- Editing mode: add and delete categories
- Header right action: `编辑` / `完成`
- Changes persist locally and are reflected when returning to the quick-note page

## Data

Use local AsyncStorage only.

- `notes.items`: array of quick notes
- `notes.settings`: note categories and category colors

Each note stores:

- `id`
- `content`
- `tags`
- `created_at`
- `updated_at`

No sync queue, remote API, preload sync, or server conflict handling is included.

## Architecture

Use Expo Router with a minimal route tree.

- `app/index.tsx`: quick-note screen
- `app/settings.tsx`: quick-note category settings
- `src/features/quick-notes`: extracted quick-note UI and helpers
- `src/features/settings`: note-category settings UI only
- `src/local`: AsyncStorage repositories for notes and settings
- `src/shared`: copied shared theme, layout, buttons, sheet, and motion pieces needed by the two screens

Dependencies should stay close to the original feature where they preserve behavior: Expo Router, React Native Gesture Handler, Bottom Sheet, Expo Blur, Expo Haptics, Reanimated, AsyncStorage, and Ionicons.

## Verification

Run the app with Expo Go first.

Verify:

- TypeScript compiles.
- Lint passes if the generated Expo project includes lint support.
- The quick-note page opens as the first screen.
- The settings button appears on the top-left of the title bar.
- Notes can be created, previewed, edited, deleted, and reloaded after app restart.
- Categories can be added, removed, recolored, and used by the quick-note editor.
- No sync UI or server calls remain.
