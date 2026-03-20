

## Hide Notes List During Profile Edit

### Problem
When `isEditingProfile` is true, the notes list (and linked hands section) still renders below the profile editing fields. This is distracting and irrelevant in the edit-profile context.

### Fix
In `ViewEditNoteModal.tsx`, wrap the content section (lines 638–onwards, the notes list / linked hands toggle area) with a `!isEditingProfile` condition so it only renders in view mode.

### File to modify
**`src/components/notes/ViewEditNoteModal.tsx`** — Add `{!isEditingProfile && (` before line 638 (`{/* Content - toggle between Notes and Linked Hands */}`) and close the condition after the notes/hands content block ends (around line 800, before the footer buttons).

This is a single conditional wrapper — no other files or logic changes needed.

