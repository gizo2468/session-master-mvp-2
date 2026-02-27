

## Plan: Fix horizontal scroll on Add Past Session page

### Root Cause
Elements inside the form (likely the radio group grid or calendar popover) are slightly exceeding the viewport width, causing horizontal scroll on mobile.

### Fix
Add `overflow-x-hidden` to the outermost wrapper in both:

1. **`src/pages/AddPastSession.tsx`** — Add `overflow-x-hidden` to the root div
2. **`src/components/poker/PastSessionForm.tsx`** — Add `overflow-x-hidden` to the root div (line 322)

This prevents any child overflow from creating a horizontal scrollbar while preserving all layout and spacing.

### Files changed
- `src/pages/AddPastSession.tsx` (1 line change)
- `src/components/poker/PastSessionForm.tsx` (1 line change)

