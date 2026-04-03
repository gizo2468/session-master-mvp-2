

## Fix Missing Hand Result in Live Session Hand List

### Root cause
The hand form saves `resultValue` (e.g., `500`) and `resultUnit` (e.g., `"BB"`), but the hand list displays `resultAmount` which maps to the DB column `amount_won`. Neither `resultAmount` nor `amountWon` are ever derived from `resultValue`, so they remain `undefined` in local state and `0` in the database.

### Fix — single file: `src/context/session/handlers.ts`

In the `addTableHand` function (~line 38), when constructing `newHand`, derive `resultAmount` from the submitted `resultValue`:

```typescript
const newHand: HandData = {
  ...hand,
  id: uuidv4(),
  createdAt: new Date(),
  tableId: tableId,
  holeCards: holeCardsArray,
  cards: hand.cards ? String(hand.cards) : '',
  currencyType: tableFormat === 'Cash' ? 'currency' : 'chips',
  // Derive resultAmount from resultValue for display in HandsList
  resultAmount: hand.resultValue ?? hand.resultAmount,
  amountWon: hand.resultValue ?? hand.amountWon ?? hand.resultAmount,
};
```

Also apply the same fix in the `updateTableHand` function so edits are reflected too.

### Why this works
- `HandsList` checks `hand.resultAmount` (line 149) — now populated from `resultValue`
- `handSync.ts` saves `amount_won: hand.amountWon || hand.resultAmount || 0` — now both are set
- On reload from DB, `sessionDataLoader.ts` already maps `amount_won → resultAmount` correctly
- Backward compatible: `??` means existing `resultAmount`/`amountWon` values are preserved

### Scope
- One file changed, two functions patched
- No layout, styling, or DB changes
- Fixes both the local state display and the DB persistence

