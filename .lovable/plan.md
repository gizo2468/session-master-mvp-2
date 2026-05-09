## Update Active Session Card: Total Buy-Ins

Replace the "Total Tables" line in `src/components/ActiveSessionsList.tsx` with a real-time **Total Buy-Ins** value, in the same row 2 position with matching font size/style. Rows 1 (name) and 3 (NLH | Cash | timer) stay unchanged.

### Display

- Label/value: `Total Buy-Ins: $565.00`
- Same classes: `text-sm text-gray-600 dark:text-gray-400 mb-2`
- Currency formatted via existing `formatCurrency(amount, currency)` from `src/utils/statisticsCalculator.ts`

### Calculation

Use the same logic already proven in `useSessionStats.ts` and `statisticsCalculator.ts`:

```
total = sum over session.tables of (table.buyIn + (table.rebuyAmount || 0))
```

Fallback when a session has no tables array (legacy sessions):
```
total = (session.buyIn || 0) + (session.rebuyAmount || 0)
```

This is real-time because `session.tables` already reflects the live session state via `SessionContext` / `useSessionsQuery`.

### Currency resolution

Order of preference:
1. `session.currency`
2. First table's `currency` (`session.tables?.[0]?.currency`)
3. `'USD'` default

Pass result into `formatCurrency(total, currency)`.

### Scope

- File touched: `src/components/ActiveSessionsList.tsx` only (single line replacement in the `ActiveSessionItem` render).
- No DB, no type, no business-logic changes.
- Resume/Delete buttons, layout, dark theme, separators all untouched.