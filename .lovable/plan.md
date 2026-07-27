Update the secondary action buttons in `src/components/poker/SessionTimerCard.tsx` so the four buttons below "Add Table" are arranged in a 2×2 grid instead of a single vertical column.

### Changes
- **`src/components/poker/SessionTimerCard.tsx`**:
  - Change the `data-tour="live-actions"` container from `flex flex-col gap-2 w-fit mx-auto` to a 2-column grid (`grid grid-cols-2 gap-2`) that fills the available width.
  - Reorder the buttons into the requested layout:
    - Row 1: **Upload Hand** | **My Notes**
    - Row 2: **Break Time** | **BB/Stack Update**
  - Keep each button's existing styling, icons, text, size (`size="sm"`), variant, `onClick`, disabled state, and `data-tour` behavior unchanged.
  - Ensure the grid wrapper is full-width within the card so the four buttons share equal widths automatically.

### Verification
- Confirm the four buttons render in the correct 2×2 order on mobile and desktop views.
- Confirm button icons, labels, and click handlers remain unchanged.
- Confirm the "Add Table" button above the grid is not modified.
- Check for any visual overflow on narrow mobile viewports by viewing the live preview.