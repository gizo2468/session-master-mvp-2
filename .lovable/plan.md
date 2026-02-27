

## Plan: Show Elapsed Duration Instead of Date in Cash Blinds History Modal

### Changes

**1. `src/components/poker/BlindHistoryModal.tsx`**
- Add a new prop `tableStartTime?: Date | string` to the component interface.
- For cash game entries, replace `format(new Date(update.created_at), 'MMM d, HH:mm')` with elapsed duration from `tableStartTime`, using the same format as the Table Card: `30M` or `1H 30M`.
- Display as `{small_blind}/{big_blind} — {elapsed}` on each row.
- Tournament mode rendering remains unchanged.

**2. `src/components/poker/TableCard.tsx`** (line 509-514)
- Pass `tableStartTime={table.startTime}` prop to `BlindHistoryModal`.

### Files changed
- `src/components/poker/BlindHistoryModal.tsx`
- `src/components/poker/TableCard.tsx`

