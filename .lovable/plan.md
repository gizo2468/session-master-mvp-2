## Goal
Make the tutorial continue reliably after tapping **End Table**, and add a dedicated highlighted step on **Total Payout** with the existing hand animation.

## Plan
1. **Fix the modal handoff in `OnboardingTour.tsx`**
   - Change the End Table transition so the tutorial advances only after the modal target for the next visible step is actually mounted and measurable.
   - Make the End Table modal steps use the same stable handoff path as other auto-advance steps so the tour cannot appear to stop behind the dialog overlay.
   - Expand the hand animation logic so the tap-hand explicitly appears on the **Total Payout** step, not just the generic cashout/confirm logic.

2. **Adjust the End Table step order in `tourSteps.ts` for mobile reliability**
   - Move the first in-modal step to the **Total Payout** field so the tutorial lands on a concrete, visible input immediately after the button tap.
   - Keep the rest of the End Table flow after it: Profit/Loss, Notes, Confirm.
   - Preserve the overall tutorial flow and keep this as the next stage after **Active Tables**.

3. **Add a dedicated Total Payout tour anchor if needed in `EndTableDialog.tsx`**
   - If the current `end-table-cashout` wrapper is too broad for a clean spotlight on mobile, split out a more precise target around the input/label block while keeping existing functionality unchanged.
   - Ensure the selector stays stable inside the shared End Table dialog rendered on `LiveSession`.

## Expected result
- Tapping the red **End Table** button keeps the tutorial running inside the popup.
- The next highlighted stage appears on **Total Payout**.
- The hand animation visibly points to that Total Payout step.
- The rest of the End Table tutorial continues instead of stopping on a black fade.

## Technical notes
- Root cause is the current first modal step targeting the full dialog (`end-table-intro`), which is fragile on the current mobile viewport because tooltip placement can make the tour look invisible even though the dialog opened.
- I will keep this frontend-only and avoid changing business logic or non-tutorial behavior.