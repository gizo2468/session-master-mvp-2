

## Add Paint Mode to Hand Range Grid

### What
Add a "paint mode" to the editable hand range grid. Clicking a legend color (Raise/Call/Fold) activates that action as a brush — cells are painted in one click. Clicking a cell that already has the active action unsets it (back to fold). When no legend color is selected, the current cycle behavior remains.

### Changes

**1. `src/components/charts/HandRangeGrid.tsx`**
- Add new props: `paintMode?: string | null` (the active action to paint)
- In `handleCellClick`: if `paintMode` is set, apply that action directly (or unset to fold if cell already matches); otherwise keep existing cycle logic

**2. `src/components/charts/CreateSolutionSheet.tsx`**
- Add `paintMode` state (`null | 'raise' | 'call' | 'fold'`)
- Make legend color chips clickable buttons — clicking one sets it as active paint mode (clicking again deselects)
- Add visual indicator (e.g., ring/border) on the active legend button
- Pass `paintMode` to `HandRangeGrid`

### Interaction summary
- No legend selected → tap cell cycles raise→call→fold (unchanged)
- Legend selected → tap cell applies that action; tap again on same-action cell → resets to fold
- Tap active legend again → deselects, back to cycle mode

