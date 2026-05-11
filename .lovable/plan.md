## Goal

Refine the existing End Table modal tour steps: update tooltip copy and add the looping hand-tap animation over the Total Payout input. The transition logic and gating are already wired up from the previous task — only copy + the extra hand animation need changes.

## Changes

### 1. `src/components/onboarding/tourSteps.ts`

Update body text on the two End Table modal steps (selectors already exist, no structural changes):

- `[data-tour="end-table-cashout"]` → "Enter your final payout amount here. If you were eliminated, simply enter 0."
- `[data-tour="end-table-confirm"]` → "Great! Now tap the yellow End Table button to finalize this game."

### 2. `src/components/onboarding/OnboardingTour.tsx`

Extend the hand-tap overlay so it also renders on the cashout step (currently it only renders for `isEndTableConfirmStep`). Change the conditional render block at line ~1064 to fire for `isEndTableCashoutStep || isEndTableConfirmStep`, anchoring the `Hand` icon to the current `rect`.

No other logic changes — gating (Next hidden, auto-advance on numeric entry, one-shot click listener on confirm to advance to the "Finishing Up" step) is already in place.