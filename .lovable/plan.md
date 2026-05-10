# Plan: Continue Tutorial Inside End Table Modal

Extend the `start-session` tour with two new steps that activate after the user taps **End Table** on the table card. These run inside the End Table dialog and gate progression until the user actually finishes the table — then the tour resumes with the existing **Finishing Up** step.

## 1. Tag the End Table dialog (`src/components/poker/EndTableDialog.tsx`)

Add `data-tour` markers so the spotlight can target elements inside the dialog:

- Wrap the Cash Out Amount field block (label + input wrapper) with `data-tour="end-table-cashout"`.
- Add `data-tour="end-table-confirm"` to the confirm `<Button>` (the gold "End Table" / "End Day" button in `DialogFooter`).

No behavior changes to the dialog itself.

## 2. Add two new tour steps (`src/components/onboarding/tourSteps.ts`)

Insert these two steps in the `start-session` array **between** the current `table-actions` step and the `live-controls` ("Finishing Up") step, both on `route: '/session'`:

1. **Mandatory Payout Input**
   - `selector: '[data-tour="end-table-cashout"]'`
   - `title: 'Enter Your Payout'`
   - `body: 'Enter your final payout amount here. This value is required to calculate your net profit or loss for this specific table.'`
   - `interactive: true`, `compact: true`, `placement: 'below'`

2. **Confirm Table Closure**
   - `selector: '[data-tour="end-table-confirm"]'`
   - `title: 'Finalize This Table'`
   - `body: 'Now, tap End Table to finalize this game and save your data.'`
   - `interactive: true`, `compact: true`, `placement: 'above'`

## 3. Wire up tour gating + auto-advance (`src/components/onboarding/OnboardingTour.tsx`)

Add detection flags for the two new steps:

```ts
const isEndTableCashoutStep = step?.selector === '[data-tour="end-table-cashout"]';
const isEndTableConfirmStep = step?.selector === '[data-tour="end-table-confirm"]';
```

### Hide the Next button on both new steps

Extend `hideNextButton` so it also covers `isEndTableCashoutStep` and `isEndTableConfirmStep`. The user can only proceed by interacting with the modal.

### Gate step 1 on a numeric payout value

Add an effect mirroring the existing Stakes-step gate: when `isEndTableCashoutStep`, find the input inside `[data-tour="end-table-cashout"]`, listen for `input`/`change`, and track `cashoutFilled` (true when value parses to a finite number > 0 — the dialog already disables its own confirm until a value exists, so the tour just needs to know when to advance).

When `cashoutFilled` flips to true, call `setStep(currentStep + 1)` to auto-activate step 2 ("Confirm Table Closure"). This satisfies the requirement that the next tooltip activates "as soon as a value is entered."

### Auto-advance on confirm click + hand-tap animation

Reuse the existing pattern that listens for clicks on `[data-tour="end-table-button"]`:

- When `isEndTableConfirmStep`, attach a one-shot `click` listener to `[data-tour="end-table-confirm"]` that calls `setStep(currentStep + 1)` (advancing to the existing **Finishing Up** step). Cleanup on step change.
- Extend the looping hand-tap overlay (already used for the table-actions step) to also render when `isEndTableConfirmStep && rect`, anchored to the confirm button's rect.

After the user confirms, the dialog closes itself (existing behavior) and the tour is already on the `live-controls` step on `/session`, which the tour will measure and spotlight as normal.

## 4. Notes / edge cases

- The dialog mounts after the user taps End Table; the tour's existing 8×80ms retry window in `focusAndMeasure` will pick up the cashout input once the dialog renders.
- If the user closes the dialog via Cancel without entering an amount, the tour stays on the cashout step (Next is hidden, no auto-advance fires). This is acceptable — re-opening End Table re-mounts the input and the gate resumes. No additional Cancel handling is in scope.
- No business logic changes; all edits are presentation/onboarding only.

## Files touched

- `src/components/poker/EndTableDialog.tsx` — add two `data-tour` attributes.
- `src/components/onboarding/tourSteps.ts` — insert two steps.
- `src/components/onboarding/OnboardingTour.tsx` — gate flags, payout-filled effect, confirm-click listener, extend hand-tap overlay.
