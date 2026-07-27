## Plan

Update `src/components/poker/HandTableSelectionModal.tsx` so each tournament table row in the "Select Table for Hand" modal displays its buy-in on the right.

### Changes
- Convert each table row into a two-column flex layout inside the existing `Button`: left = current name/details block (unchanged), right = buy-in block, vertically centered (`flex items-center justify-between gap-3`).
- For tournament tables only (`table.format === 'Tournament'` and `table.buyIn != null`), render `Buy-In: {symbol}{amount.toFixed(2)}` using `table.buyIn` and `table.currency`.
- Add a small currency-symbol helper (USD `$`, EUR `€`, GBP `£`, ILS `₪`, default `$`) or import from `src/utils/statisticsCalculator.ts`.
- Prevent mobile overlap: wrap left block with `min-w-0 flex-1` and add `truncate` to the name line; right block gets `shrink-0 text-right text-sm`.
- Keep existing styling, border, colors, click behavior, and cash-table rendering unchanged.
