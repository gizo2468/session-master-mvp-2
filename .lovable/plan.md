

## Plan: Cash game Stack Amount + Blinds Update Note on Table Card

### Changes

**1. `src/components/poker/BBStackUpdateModal.tsx`** — Cash game stack field changes:
- Rename label from "Stack (BB)" to "Stack Amount"
- Change placeholder from "e.g. 100" to "e.g. 500"
- Remove the BB-to-currency conversion display (≈ $X) — the input IS already in currency
- Add currency symbol prefix to make it clear it's a money amount
- Rename `stackBB` field usage to represent cash value (keep same field name internally for compatibility)

**2. `src/services/bbStackUpdateService.ts`** — Update `formatHistoryLine` for cash games:
- Include the `created_at` timestamp in the return data (already present)
- Update format to show "SB/BB" and elapsed time from table start
- Add a new method `formatCashHistoryLine(update, tableStartTime)` that returns e.g. `"$1/$2 • Blinds updated after 00:14"`

**3. `src/components/poker/TableCard.tsx`** — Display blinds update note on cash table cards:
- For the latest blind history entry, show the SB/BB values AND elapsed time from table start
- Calculate time diff between `update.created_at` and `table.startTime`
- Format as `"$1/$2 – Updated after HH:MM"` in a subtle note below the blinds display
- Show stack amount if saved (e.g. "Stack: $500")

**4. `src/services/bbStackUpdateService.ts`** — Save logic:
- For cash games, store the stack value as the raw money amount (already using `stack` column, just ensure it stores the cash value not BB value)

### Files changed
- `src/components/poker/BBStackUpdateModal.tsx`
- `src/services/bbStackUpdateService.ts`  
- `src/components/poker/TableCard.tsx`

