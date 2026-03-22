

## Fix: Edit Profile Popup Crash on iPhone in Notes Flow

### Root Cause

In `ViewAllNotesModal`, when clicking an opponent, the "All Notes" dialog closes first (`onOpenChange(false)`) and then `ViewEditNoteModal` opens as a standalone dialog. When the user taps "Edit Profile", `setIsEditingProfile(true)` triggers a significant DOM change — the notes list hides, color selector appears, input field appears, avatar becomes editable. On iPhone, this layout shift causes Radix Dialog's overlay to incorrectly detect an "outside click", which fires `onOpenChange(false)` on the ViewEditNoteModal. Since the parent ViewAllNotesModal is already closed, the user lands back on Home.

This is a known Radix UI mobile issue where rapid content changes inside a Dialog cause touch events to be misinterpreted as dismiss gestures.

### Fix

**`src/components/notes/ViewEditNoteModal.tsx`** — Add `onInteractOutside` and `onPointerDownOutside` handlers to DialogContent (line 417) that prevent accidental dismissal:

```tsx
<DialogContent 
  className={...}
  onInteractOutside={(e) => e.preventDefault()}
  onPointerDownOutside={(e) => e.preventDefault()}
>
```

This prevents the dialog from closing due to overlay touch events on mobile while still allowing the explicit "Close" button (line 806) and the X button to work normally via `onOpenChange`.

Single file, 2 props added to one element.

