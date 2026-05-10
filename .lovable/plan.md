## Goal

Update only the description text of the **second** "Active Tables" tutorial step (the one highlighting Rebuy / End Table / Add Hand). Title, placement, selector, and the first sub-step are untouched.

## Change

### `src/components/onboarding/tourSteps.ts`

In the second `'Active Tables'` step (the one with `selector: '[data-tour="table-actions"]'` and `placement: 'above'`), replace the `body` value with:

```
Quickly log a Rebuy, add a Hand History note, or use End Table to close this specific table and finalize its results.
```

No other fields change. The first step (selector `[data-tour="table-stats"]`, `placement: 'below'`) remains exactly as-is.