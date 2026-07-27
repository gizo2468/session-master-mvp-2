Visual update to the START and DURATION values inside the Active Table card in the Live Session view.

**Files to change**
1. `src/components/poker/TableTimerDisplay.tsx` — render the duration value without a `<Badge>` wrapper.
2. `src/components/poker/TableCard.tsx` — update the START value’s typography and align the duration row so the two values look balanced.

**What will change**
- Remove the yellow pill/background currently shown around the duration (`variant="timeStarted"` on the `Badge`).
- Keep the small `Clock` icon directly beside the duration digits, with no surrounding container.
- Apply a slightly stronger font weight and a clean number style to the duration text so values like "21h 54m" are easy to scan.
- Update the start time digits (e.g. "04:13") with a cleaner, slightly more prominent font style that matches the upgraded duration.
- Keep the START / DURATION labels, their centered alignment, the vertical divider, and the rest of the card layout exactly as-is.
- No changes to timer calculations, saved values, or functionality.

**Implementation details**
- In `TableTimerDisplay`, replace the `Badge` with a plain `inline-flex` span containing the `Clock` icon and the formatted time.
- Use the app’s existing font tokens (`font-mono` for digit clarity, `font-semibold` for weight).
- In `TableCard`, apply matching styling to the start time value and ensure the duration and start time values sit evenly on either side of the divider.
- The icon remains the same `Clock` icon and the same size already in use.