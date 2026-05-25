# Plan

Lock the real gold **End Table** button only while the **End Table** tutorial is active, and only unlock it on the **Finalize This Table** step.

## What I’ll change

1. **Read live tutorial state inside `EndTableDialog`**
   - Use the existing onboarding hook to detect whether the tutorial is currently active.
   - Check the active tour path and current step so this logic applies only during the guided flow.

2. **Gate the real confirm button by the current tutorial step**
   - Compute a tutorial-only boolean that is `true` for the earlier End Table steps:
     - `Total Payout`
     - `Profit / Loss`
     - `Notes (Optional)`
   - Keep that boolean `false` once the user reaches `Finalize This Table`.

3. **Harden the button so early taps do nothing**
   - Extend the existing `disabled` condition on the real gold button with the tutorial-only gate.
   - Add a defensive no-op guard on the click handler as well, so even if a click slips through during a transition, it cannot submit, close the modal, advance incorrectly, or break the tutorial.

## Result

- During the End Table tutorial, the real gold button is fully blocked on the early steps.
- On `Finalize This Table`, the same real button becomes clickable and continues the tutorial normally.
- Outside the tutorial, normal End Table behavior stays exactly the same.

## Technical details

- File to update: `src/components/poker/EndTableDialog.tsx`
- Reuse existing tour step metadata from `src/components/onboarding/tourSteps.ts`
- No changes to tutorial copy, layout, modal structure, or non-tutorial behavior