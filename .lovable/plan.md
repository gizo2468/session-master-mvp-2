## Fix: Previous button on two End-flow tutorial steps

### Problem

Two tour steps break when the user presses **Previous**:

1. **"Finishing Up"** (selector `[data-tour="live-controls"]`, last step) — the previous step in the array is `end-table-confirm`, which only exists inside the End Table modal. By the time the user reaches Finishing Up, the table has already been ended and the modal is gone, so the selector can never be found. The retry loop in `useLayoutEffect` (OnboardingTour.tsx lines 228–252) then auto-walks backwards in the same direction through `end-table-notes`, `end-table-profit`, `end-table-cashout-input` (all modal-only, also missing), until it lands on `table-actions` — feeling like the tour "freezes" or "skips multiple steps".

2. **"Total Payout"** (`end-table-cashout-input`, inside modal) — Previous targets `table-actions`, which lives on the live session page *behind* the open End Table modal. The modal stays open, hides the spotlight, and the user perceives Previous as a no-op or as breaking the flow.

`handlePrev` itself is fine; the issue is purely the destination step being unreachable in the current UI state.

### Fix (scoped, surgical)

In `src/components/onboarding/OnboardingTour.tsx`, special-case the Previous handler for exactly these two steps. Do not touch Next, Done, design, positioning, or any other step.

1. **Previous from `live-controls` ("Finishing Up")**
   - Jump directly to the `table-actions` step (index of `[data-tour="table-actions"]` in `steps`), skipping the modal-only steps that no longer have a host in the DOM.
   - Set `directionRef.current = -1` so any auto-skip behaves correctly, then call `setStep(targetIndex)`.

2. **Previous from `end-table-cashout-input` ("Total Payout")**
   - Close the End Table modal first, then jump to `table-actions`.
   - Closing is done by dispatching a small custom event the dialog already can listen for, or by clicking the dialog's existing Cancel button via `document.querySelector` inside the active `[role="dialog"]`. Reuse whatever the dialog exposes; do not change `EndTableDialog` props/behavior beyond adding a listener if needed.
   - Then `directionRef.current = -1` and `setStep(tableActionsIndex)`.

3. **Helper**
   - Add a tiny `findStepIndex(selector)` lookup inside the component so the indices stay correct if `tourSteps.ts` is reordered later.

### Out of scope

- No changes to `tourSteps.ts` ordering or copy.
- No changes to Next / Done handlers.
- No changes to the cashout input editability fix or the modal-portal layering fix.
- No changes to `useOnboardingTour` state machine.

### Files

- `src/components/onboarding/OnboardingTour.tsx` (only file edited)
- Possibly a 2-line listener addition in `src/components/poker/EndTableDialog.tsx` *only if* no existing close hook is reusable.

### Expected result

- Pressing Previous on **Total Payout** closes the End Table modal and lands the user on the **Active Tables / End Table** step (`table-actions`) with the spotlight visible and correctly positioned.
- Pressing Previous on **Finishing Up** lands the user on the same **table-actions** step without flickering through unreachable modal steps.
- Tour state, session state, and modal state remain consistent. Next/Done flow is unchanged.
