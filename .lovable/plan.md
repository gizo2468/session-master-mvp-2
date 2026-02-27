

## Plan: Update Cash Blinds History Modal — Title, Content & Time Style

### Changes to `src/components/poker/BlindHistoryModal.tsx`

**1. Title** (lines 104-107):
- For cash mode, change title text to `"STACK HISTORY"` and center-align it
- Remove the `flex items-center justify-between` wrapper for cash mode since there's no edit button

**2. Row content** (lines 174-177):
- Replace `{update.small_blind}/{update.big_blind}` with the stack value: `${currencySymbol}${update.stack}`
- Need to accept a new `currencySymbol` prop

**3. Time format** (lines 196-208):
- For cash mode, replace the plain `<span>` with a `<Badge variant="timeStarted">` with a `Clock` icon, matching `TableTimerDisplay` style
- Use same duration format: under 1h → `Xm Ys` pattern, over 1h → `Xh Ym` (matching `TableTimerDisplay.formatTime`)

### Changes to `src/components/poker/TableCard.tsx` (line 509-516)

- Pass `currencySymbol={currencySymbol}` prop to `BlindHistoryModal`

### Files changed
- `src/components/poker/BlindHistoryModal.tsx`
- `src/components/poker/TableCard.tsx`

