

## Plan: Notes Feature Updates (3 Tasks)

### Task 1: Make note text optional when saving

**Current behavior**: Line 229 in `AddNoteModal.tsx` requires both `opponentName.trim()` and `noteBody.trim()` to be truthy. The insert on line 265 sends `noteBody.trim()` which would be empty string.

**Fix**:
- `AddNoteModal.tsx` line 229: Change validation to only require `opponentName.trim()`, remove the `noteBody.trim()` check
- Line 265: Change `note_body: noteBody.trim()` to `note_body: noteBody.trim() || ''` (empty string is fine)
- Update error message to say "Please fill in the opponent name"

### Task 2: Add image thumbnail to note list views

In both `ViewAllNotesModal.tsx` (line 280-305) and `MyNotesCard.tsx` (line 250-276), the opponent card rows show only a color dot + name. Need to add a small circular avatar thumbnail next to the color dot for opponents that have an image.

**Changes**:
- In both list views, add a 24x24px rounded avatar thumbnail before the nickname when `opponent.profile.image_url` exists
- The thumbnail is display-only in the list (no tap action in the list row itself — tapping the row opens the opponent detail modal as before)

### Task 3: Add fullscreen image popup from opponent detail view and list views

**ViewEditNoteModal already has a fullscreen viewer** (lines 886-912) that opens when clicking the avatar in view mode (line 460). This already works with X close button and dismiss-on-outside-click via Dialog.

For the **list views** (ViewAllNotesModal and MyNotesCard search results), add a small camera/image icon indicator on rows with images. Tapping that icon opens a fullscreen lightbox popup (same pattern as the existing one in ViewEditNoteModal).

**Changes to ViewAllNotesModal.tsx and MyNotesCard.tsx**:
- Add state for `fullscreenImageUrl` and `isImageFullscreen`
- On each opponent row that has `image_url`, show a small clickable avatar thumbnail
- Tapping the thumbnail (with `e.stopPropagation()` to prevent opening the opponent detail) opens the fullscreen lightbox
- Lightbox: dark bg, centered image, X close button (min 44x44px touch target), dismiss on background tap

### Files to modify

1. **`src/components/notes/AddNoteModal.tsx`** — Remove note text requirement from validation (line 229)
2. **`src/components/notes/ViewAllNotesModal.tsx`** — Add avatar thumbnail + fullscreen lightbox
3. **`src/components/notes/MyNotesCard.tsx`** — Add avatar thumbnail + fullscreen lightbox to search results

