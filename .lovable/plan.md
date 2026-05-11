## Goal

Make the End Table modal tour flow reliably from Total Payout → yellow End Table → "Finishing Up" on the dashboard, and update the two tooltip strings.

## Root cause of "tutorial stops"

In `OnboardingTour.tsx` the auto-advance effect for the cashout step (lines ~641–662) only advances when `Number.isFinite(v) && v > 0`. The tooltip explicitly invites the user to enter `0` if they were eliminated, but `0` fails the gate, so the tour appears frozen on the payout field.

## Changes

### 1. `src/components/onboarding/OnboardingTour.tsx`

In the `isEndTableCashoutStep` effect, relax the condition so any finite non-negative numeric value advances the tour (matches the Stakes-step pattern, which already allows 0 for freerolls):

```ts
if (Number.isFinite(v) && v >= 0) {
  directionRef.current = 1;
  setStep(currentStep + 1);
}
```

No other logic changes — the one-shot click listener on `[data-tour="end-table-confirm"]` already advances to the next step (`live-controls` = "Finishing Up") when the user taps the yellow button, and `EndTableDialog`'s own `onConfirm` closes the modal, so the next step renders against the live session controls automatically. The hand-tap overlay already renders for both `isEndTableCashoutStep` and `isEndTableConfirmStep` and anchors to the current `rect`.

### 2. `src/components/onboarding/tourSteps.ts`

Update tooltip copy on the two modal steps (no structural changes):

- `[data-tour="end-table-cashout"]` body → `"Enter your payout here (enter 0 if you were eliminated)."`
- `[data-tour="end-table-confirm"]` body → `"Now tap here to close the table."`

## Out of scope

No changes to `EndTableDialog.tsx`, no new selectors, no changes to the live-controls step.
