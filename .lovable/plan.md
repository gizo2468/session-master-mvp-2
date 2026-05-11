## Goal
Make the **End Table** button reliably open the payout dialog during the onboarding tutorial and let the tutorial continue inside that popup instead of freezing behind a dark overlay.

## What I found
The bug is in the **frontend interaction between the onboarding tour and the shared End Table dialog**, not in Supabase or session saving.

The current failure point is:
1. The tutorial advances from **`table-actions`** as soon as the red **End Table** button is tapped.
2. The next tutorial step immediately looks for **`[data-tour="end-table-cashout"]`**.
3. There is a short mount gap where the shared Radix dialog is not fully measurable yet.
4. During that gap, the tour cannot bind to the popup target, so the dialog-lifting / spotlight logic does not stabilize correctly.
5. The result is the dark modal shade without the expected payout popup/tutorial continuation.

## Plan
### 1. Stabilize the transition from button tap to popup step
Update the onboarding flow so the tutorial does **not** blindly advance on button click alone.
Instead, it should advance only after the shared End Table dialog has actually mounted and the **Total Payout** field is present.

### 2. Harden modal target detection inside `OnboardingTour`
Refactor the modal-step measurement logic to:
- use the existing **visible-element lookup** consistently
- wait for the actual popup target instead of skipping too early
- avoid losing the tooltip / spotlight state during the dialog mount gap
- stop the end-table steps from auto-falling through when the target is only temporarily unavailable

### 3. Fix dialog layering for tutorial-controlled modal steps
Ensure the actual Radix dialog portal/content/overlay are lifted consistently once the End Table popup exists, so the popup remains visible and interactive above the live-session screen and the tour overlay.

### 4. Keep the single shared End Table flow
Preserve the unified live-session path through:
- `LiveSession.tsx`
- `useEndTableActions.ts`
- `EndTableDialog.tsx`

and make sure the tutorial only follows that shared popup flow.

### 5. Validate the exact broken sequence
I’ll verify this exact path after the code change:
- Active Tables tutorial step
- tap **End Table**
- popup opens immediately
- **Total Payout** is highlighted
- entering a payout advances the tour
- confirm button is highlighted
- ending the table closes the popup and continues the tutorial
- no frozen dark shade remains

## Files to update
- `src/components/onboarding/OnboardingTour.tsx`
- `src/components/onboarding/tourSteps.ts` if step timing/prepare hooks need adjustment
- `src/components/poker/EndTableDialog.tsx` only if a stable dialog anchor is needed
- `src/pages/LiveSession.tsx` or `src/hooks/useEndTableActions.ts` only if the tour needs a reliable dialog-open signal

## Technical details
I expect the main fix to be in `OnboardingTour.tsx`:
- replace direct `document.querySelector(...)` calls in modal-related effects with the visible-target helper
- wait for the popup selector before advancing from the End Table button step
- add a more reliable modal-step readiness check instead of the current short retry/auto-skip behavior
- keep the interactive overlay logic stable while `rect` is still being established
- lift the real Radix dialog portal/content when the modal step becomes active

Once approved, I’ll implement and verify it in the preview.