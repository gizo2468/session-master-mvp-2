

## Plan: Update Cash Game Table Card Blind Display & History Formatting

### Changes

**1. `src/components/poker/TableCard.tsx`** (lines 282-309) — Cash mode blinds section:
- Update the main "Blinds:" line to show the **latest** blinds from `blindHistory` (if any updates exist), falling back to the original `table.smallBlind/table.bigBlind`.
- Reformat the blind history line: replace raw `$2/$4 – Stack: $250 – Updated after 00:16` with structured layout:
  - Line 1: `Current Level: $2/$4`
  - Line 2: `CURRENT STACK: $250` (only if stack exists)
  - Line 3: A `<Badge>` component matching the DURATION chip style (`variant="timeStarted"` with clock icon), showing `Updated after 00:16`
- This means we stop using `BBStackUpdateService.formatCashHistoryLineWithTime()` as a single string, and instead render the parts separately in JSX.

**2. `src/services/bbStackUpdateService.ts`** — No changes needed. The raw data fields (`small_blind`, `big_blind`, `stack`, `created_at`) are already available on the update object. We'll read them directly in the TableCard component.

**3. No changes to Tournament mode** — The tournament blind history rendering (lines 328-355) remains untouched.

### Implementation Detail

In the cash blinds section (~line 282-309):
- Compute `latestUpdate = blindHistory[blindHistory.length - 1]` if it exists
- Main blinds line: show `latestUpdate.small_blind / latestUpdate.big_blind` if available, else original values
- History note: render as three styled lines using `Badge variant="timeStarted"` for the elapsed time chip (same as `TableTimerDisplay` uses)
- Import `Badge` (already imported on line 20)

### Files changed
- `src/components/poker/TableCard.tsx`

