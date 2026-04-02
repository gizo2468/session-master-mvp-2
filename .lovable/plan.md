

## Add Range-Fill (Double-Click) to Hand Range Grid

### What
When paint mode is active, double-clicking a cell marks it as the range start. Double-clicking a second cell on the same logical line fills all cells between them with the active action. If they're not on the same line, nothing happens.

### Logic for "same line"
- **Pairs**: both on diagonal (`row === col`) → fill all pairs between them
- **Suited row**: both above diagonal with same row (`row1 === row2`, both `col > row`) → fill all suited hands in that row between the two columns
- **Offsuit column**: both below diagonal with same col mapped to same high card (`col1 === col2`, both `row > col`) → fill all offsuit hands in that column between the two rows

### Changes — single file: `src/components/charts/HandRangeGrid.tsx`

1. Add `rangeStart` state: `{ row: number; col: number } | null`
2. Add `onDoubleClick` handler to each cell button:
   - Only active when `editable && paintMode`
   - If no `rangeStart` → set it, visually highlight the cell (e.g. ring)
   - If `rangeStart` exists → check if same line; if yes, compute all cells between, apply `paintMode` action to all, clear `rangeStart`; if no, reset `rangeStart` to this new cell
3. Add visual indicator (ring/outline) on the start cell so user knows it's selected
4. Single-click behavior stays exactly as-is (no changes to `handleCellClick`)

### Line detection helper
```
function getCellsBetween(r1, c1, r2, c2):
  if r1===c1 && r2===c2:  // both pairs
    return all (i,i) between min/max
  if c1>r1 && c2>r2 && r1===r2:  // same suited row
    return all (r1, j) for j between min/max cols
  if r1>c1 && r2>c2 && c1===c2:  // same offsuit col
    return all (i, c1) for i between min/max rows
  return null  // not same line
```

### No other files changed
The `CreateSolutionSheet` already passes `paintMode` — no changes needed there.

