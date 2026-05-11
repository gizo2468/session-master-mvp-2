## Goal
After tapping **End Table** on the Active Tables step, the tutorial must continue inside the End Table popup with a highlighted **Total Payout** stage (gold spotlight + tooltip + tap-hand), then continue through Profit/Loss → Notes → Confirm.

## What's already in place
- A step exists for `[data-tour="end-table-cashout"]` titled "Total Payout".
- `EndTableDialog.tsx` wraps the Total Payout block with `data-tour="end-table-cashout"`.
- `OnboardingTour.tsx` has a click handler that, when the user is on the Active Tables step, waits for `end-table-cashout` to mount and advances the tour.

## Why it still appears to stop
Two concrete problems remaining:

1. **Duplicate `data-tour="end-table-cashout"` anchor.** `TableCard.tsx` (lines 593–613) contains a legacy local End Table dialog with the same `data-tour` attribute. When React mounts/unmounts during the dialog handoff there's a real risk of the tour resolving to the wrong (hidden) anchor on slow renders, which leaves the spotlight invisible.
2. **Tour overlay z-index vs. Radix Dialog.** When the spotlight target is inside a dialog, the tour root drops to `z-[60]`. Radix `DialogContent` typically renders at `z-50`, but its portal can re-stack above siblings, leaving the spotlight stroke/tooltip hidden underneath the dialog content on some renders.

## Plan

1. **`src/components/poker/TableCard.tsx`** — remove the duplicate `data-tour="end-table-cashout"` attribute (and the duplicate `data-tour="end-table-confirm"` on the legacy local dialog), since the shared `EndTableDialog` from `LiveSession` is the one actually used. Keep the legacy dialog markup intact for safety, just strip the tour anchors so there is exactly one source of truth.

2. **`src/components/onboarding/OnboardingTour.tsx`**
   - Bump the tour root z-index when `stepInsideDialog` is true so the spotlight stroke, dim bands, tap-hand and tooltip render reliably above Radix `DialogContent`.
   - On the Active Tables → End Table handoff, when the polling finds the cashout anchor, force an immediate `readRect()` + `setTooltipVisible(true)` on the next frame so the spotlight appears the instant the popup is visible (no perceived "stop").
   - Ensure the tap-hand animation explicitly renders on the Total Payout step (already wired via `isEndTableCashoutStep`) and is anchored to the input rect, not the wrapper, so it sits visibly inside the field.

3. **`src/components/onboarding/tourSteps.ts`** — minor polish only: keep the End Table step order (Total Payout → Profit/Loss → Notes → Finalize) and verify the Total Payout copy reads naturally as the first in-popup step.

## Expected result
- Tapping the red **End Table** button on the Active Tables stage opens the End Table popup AND immediately shows the next tutorial stage with a gold spotlight on **Total Payout**, a tooltip explaining the field, and a tap-hand animation pointing at the input.
- The tutorial then continues through Profit/Loss, Notes and the Finalize button as before.
- No more "tutorial just stops" behavior when the popup opens.

## Scope notes
- Frontend/presentation only. No business logic, no DB, no behavior changes to the End Table flow itself.
