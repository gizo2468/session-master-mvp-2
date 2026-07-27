The four action buttons in `src/components/poker/SessionTimerCard.tsx` are currently sized by their text content, so the two top-row buttons and the two bottom-row buttons have different widths. This plan only adjusts their dimensions and alignment — colors, icons, text, and functionality stay unchanged.

### What to change
1. **Top row (Add Table / End Session)**
   - Make both buttons share the row width evenly.
   - Apply `flex-1` and `w-full` to the button elements/wrappers so Add Table and End Session are identical width and height.
   - Keep the existing `gap-2` spacing and centered content inside each button.

2. **Bottom column (BB/Stack Update / Upload Hand)**
   - Make both buttons stretch to the full width of the parent column.
   - Apply `w-full` to each button and ensure each wrapper is full-width so the two buttons are identical width and height.
   - Keep the existing vertical `gap-2` and centered icon/text content.

### Technical details
- File: `src/components/poker/SessionTimerCard.tsx`
- Classes to update:
  - Add Table button: `flex-1 w-full justify-center`
  - End Session button wrapper + button: `flex-1 w-full justify-center`
  - BB/Stack Update and Upload Hand buttons: `w-full justify-center` (inside a full-width wrapper)
- No `size` variant changes, so heights remain matched.
- `data-tour` attributes remain on their existing elements.

After the change, the four buttons will look balanced and consistent across mobile and desktop viewports.