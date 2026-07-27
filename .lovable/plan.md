The current button group in `src/components/poker/SessionTimerCard.tsx` stretches the bottom buttons to the full card width and makes the top-row widths slightly uneven. This plan adjusts only the layout, spacing, and symmetry — text, icons, colors, and click behavior stay unchanged.

### What to change
1. **Top row (Add Table / End Session)**
   - Replace the flex row with a `grid grid-cols-2 gap-2` so the two buttons are guaranteed equal width and equal height.
   - Set both buttons (and the End Session wrapper) to `w-full` so each fills its grid cell.
   - Keep icon + text centered inside each button.

2. **Bottom column (BB/Stack Update / Upload Hand)**
   - Wrap the stacked buttons in a compact, content-width container (`w-fit mx-auto`) so they are not stretched across the card.
   - Set both buttons to `w-full` inside that container so the shorter button grows to match the wider one, keeping them equal width.
   - Keep the vertical `gap-2` spacing and centered icon/text.

### Technical details
- File: `src/components/poker/SessionTimerCard.tsx`
- Classes to update:
  - Top row container: `grid grid-cols-2 gap-2`
  - Add Table button: `w-full flex items-center justify-center gap-2` (remove `flex-1`)
  - End Session wrapper: `w-full` (button remains `w-full`)
  - Bottom actions container: `flex flex-col gap-2 w-fit mx-auto`
  - BB/Stack Update and Upload Hand buttons: `w-full flex items-center justify-center gap-2`
- `data-tour` attributes remain on their existing elements.
- No `size` variant changes, so the top buttons stay default height and the bottom buttons stay `sm` height.

After the change, the top row will be a symmetrical pair of equal, larger buttons, while the bottom two will be a compact, equal-width column centered underneath them.