

## Plan: Cash Table Card — Level Counter + Readable Duration Format

### Changes to `src/components/poker/TableCard.tsx` (lines 295-321)

**1. Replace "Current Level" with incrementing level counter:**
- The `blindHistory` array is ordered chronologically. The last entry is shown via `slice(-1)`.
- Replace `Current Level: $X/$Y` with `LVL: {blindHistory.length}` (since each entry in `blindHistory` is one update, the count = the level number).

**2. Update duration format:**
- Replace `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` with:
  - If `hours === 0`: `${minutes}M`
  - If `hours > 0`: `${hours}H ${minutes}M`

### Files changed
- `src/components/poker/TableCard.tsx` (lines 305, 309-310 only)

