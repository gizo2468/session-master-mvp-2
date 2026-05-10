# Plan: Mandatory End Table Interaction on Active Tables Step 2

## Scope
Update the second "Active Tables" tutorial step (selector `[data-tour="table-actions"]`) so the user must tap the **End Table** button to proceed. Hide the Next button. Add a looping hand-tap animation directly over the End Table button. Keep the existing gold highlight (no spotlight changes) and tooltip placement (`above`).

## Changes

### 1. `src/components/onboarding/tourSteps.ts`
- Replace the `body` of the `[data-tour="table-actions"]` step with the new copy:
  > "Log a Rebuy or Hand History instantly for your records. Note: To end your session later, you must first close all tables individually. Let's try it now—tap End Table to see how it works."
- All other fields on this step stay identical (`title: 'Active Tables'`, `interactive: true`, `placement: 'above'`, `compact: true`, `route: '/session'`).

### 2. `src/components/poker/TableCard.tsx`
- Add a stable hook so the tour can find the End Table button: add `data-tour="end-table-button"` to the active-table End Table `<Button>` at line 421 (the one inside `[data-tour="table-actions"]`).

### 3. `src/components/onboarding/OnboardingTour.tsx`
Three additions, all scoped to the `[data-tour="table-actions"]` step:

a. **Hide Next button.** Add a derived flag `isTableActionsStep = step?.selector === '[data-tour="table-actions"]'` and include it in the existing `hideNextButton` condition (`hideNextButton = isStartSessionStep || isSubmitSessionStep || isTableActionsStep`). Previous button stays visible.

b. **Auto-advance on End Table click.** Add a new `useEffect` that mirrors the existing start-session pattern: when the active step is `[data-tour="table-actions"]`, find `[data-tour="end-table-button"]` and attach a one-shot `click` listener that calls `setStep(currentStep + 1)`. Cleans up on step change.

c. **Looping hand animation over End Table.** Render a new pulsing-hand overlay (separate from the existing `showTapHand` block which is anchored on the spotlight center). When `isTableActionsStep && rect`, locate `[data-tour="end-table-button"]`, read its `getBoundingClientRect()`, and render a `<Hand />` icon at that center using the same `tour-tap-hand` animation class already used by the existing tap-hand. It must keep looping (no `once`-style stop) until the step advances. Re-measure on scroll/resize alongside the existing rAF tick (uses `rect`/`viewport` deps so it recomputes on each render).

### Acceptance
- Step 2 shows the new description text.
- Hand icon pulses on top of the red End Table button.
- Next button is not rendered; Previous still works (returns to the table-stats step).
- Tapping End Table advances the tour to the next step ("Finishing Up") and opens the End Table dialog as it does today (the click is not preempted — listener only observes).
- Gold highlight outline and `above` tooltip placement are unchanged.

## Out of scope
- No changes to the first Active Tables sub-step.
- No changes to the EndTableDialog flow itself.
- No new CSS — reuse `.tour-tap-hand` keyframes.
