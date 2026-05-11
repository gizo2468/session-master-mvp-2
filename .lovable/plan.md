## What’s actually broken
After the user taps the red **End Table** button on the **Active Tables** step, the tutorial advances immediately to the next step **before the modal target exists**. The tour keeps using the **old spotlight rect** for a moment, so its dark interactive overlay stays anchored to the old step and effectively blocks the new modal view, which is why the screen looks frozen under a weird shade.

## Implementation plan
1. **Stabilize step transitions in `src/components/onboarding/OnboardingTour.tsx`**
   - Clear the previous spotlight rect as soon as the step changes.
   - Do not render the interactive dim bands for a new step until its real target has mounted and been measured.
   - Keep the tooltip/overlay from blocking the screen during the short gap between clicking the red button and the modal content appearing.

2. **Make the End Table modal transition reliable**
   - Keep the current behavior where clicking the red **End Table** button advances the tutorial.
   - Wait for `[data-tour="end-table-cashout"]` to exist before showing the spotlight/highlight for the modal step.
   - Ensure the dialog lift only applies when the modal target actually exists, so the tutorial layers above the right modal state instead of trapping the previous one.

3. **Preserve the intended modal tutorial flow**
   - Step 1 in the modal highlights **Total Payout** with the hand-tap animation and copy: **“Enter your payout (or 0 if eliminated).”**
   - Once a valid number is entered, move to Step 2 and highlight the yellow **End Table** button with the hand-tap animation and copy: **“Tap here to close the table.”**
   - Clicking the yellow button closes the modal and advances the tutorial to **Finishing Up** on the main session screen.

4. **Validate the broken path specifically**
   - Re-test the exact sequence: **Active Tables → red End Table → Total Payout → yellow End Table → Finishing Up**.
   - Confirm there is no lingering dark overlay, no stuck pointer-blocking layer, and no skipped tutorial step.

## Files to update
- `src/components/onboarding/OnboardingTour.tsx`
- `src/components/poker/TableCard.tsx` only if a tiny marker/timing adjustment is still needed after the tour fix

## Technical notes
- The likely primary fix is in `OnboardingTour.tsx`, not in route state or session logic.
- The bug is a **stale spotlight / missing-target timing issue** during a modal transition.
- I’ll avoid changing unrelated session behavior and keep this focused on the onboarding flow only.