## Goal
Make the tutorial continue seamlessly after tapping the red **End Table** button: first highlight **Total Payout**, then highlight the yellow **End Table** confirm button, then resume on the final **Finishing Up** step on the dashboard.

## What’s actually broken
The tutorial steps for `end-table-cashout` and `end-table-confirm` were added to `src/components/poker/EndTableDialog.tsx`, but the red **End Table** button inside the live table card does **not** open that component.

Instead, the live flow opens a separate inline Radix `Dialog` inside `src/components/poker/TableCard.tsx`.
That means the tour advances, but its selectors don’t exist in the modal the user is actually seeing, so the tutorial appears to stop or disappear.

## Implementation plan

### 1. Put the tutorial anchors on the real modal used by the red button
Update `src/components/poker/TableCard.tsx` so the inline End Table dialog contains the same tutorial hooks the tour is waiting for:
- Add `data-tour="end-table-cashout"` around the **Total Payout** field container
- Add `data-tour="end-table-confirm"` to the yellow confirm button
- Keep the labels/text in the modal aligned with the requested tutorial wording and field meaning

### 2. Keep the tutorial alive across the transition from card to modal
Refine `src/components/onboarding/OnboardingTour.tsx` so the step change from **Active Tables** → **Total Payout** survives the modal opening timing:
- Wait for the real dialog target to mount before skipping or hiding the step
- Preserve the current behavior where clicking the red button advances the tour
- Ensure the spotlight, tooltip, and tap-hand render above the modal content during these two dialog steps

### 3. Enforce the two-step modal sequence exactly as requested
In `src/components/onboarding/OnboardingTour.tsx`:
- Step 1: highlight **Total Payout** with the hand-tap animation and tutorial copy
- After any valid numeric value is entered, auto-advance to Step 2
- Step 2: move the highlight + hand-tap animation to the yellow **End Table** button
- Hide the normal Next button for these guided steps so the user follows the intended flow

### 4. Resume on the dashboard’s final tutorial step after confirm
Keep the confirm action behavior synchronized so that when the yellow button is tapped:
- the modal closes
- the table is ended normally
- the tutorial advances immediately to **Finishing Up** on the main live session screen

## Files to update
- `src/components/poker/TableCard.tsx`
- `src/components/onboarding/OnboardingTour.tsx`

## Expected result
On the live session page, tapping the red **End Table** button during the tutorial will open the real End Table modal and continue the tutorial inside it, with the correct highlight order and final return to the dashboard step.