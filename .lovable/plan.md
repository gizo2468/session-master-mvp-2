# Fix plan: Total Payout stays editable during the tutorial

## Goal
Keep the onboarding tutorial active inside the End Table modal while making the **Total Payout** input behave exactly like normal: tap to focus, keyboard opens, pointer events pass through, and users can type without the tour interrupting them.

## What I’ll change

1. **Stop auto-advancing on first typed value**
   - Remove the current cashout-step behavior that advances the tour immediately on `input` / `change`.
   - This is the most likely reason typing feels blocked: the step exits as soon as the field receives a valid number.

2. **Restore explicit navigation for this step**
   - Make the cashout step navigable through the tutorial controls instead of automatic input detection.
   - Keep the rest of the End Table modal tour flow unchanged.

3. **Harden click-through behavior for the highlighted input**
   - Narrow the tour’s event blocking so the cashout input remains fully interactive during this specific step.
   - Preserve the existing modal portal/layering fix and avoid changing non-modal onboarding behavior.

4. **Validate modal-specific interaction rules**
   - Ensure the End Table modal still ignores Radix “outside interaction” only for the tour overlay.
   - Confirm the tooltip/highlight remains visible above the modal without stealing focus from the input.

## Technical details

- Update `src/components/onboarding/OnboardingTour.tsx`
  - Remove or gate the `isEndTableCashoutStep` effect that listens for `input`/`change` and calls `setStep(currentStep + 1)`.
  - Adjust the step’s navigation behavior so this step no longer hides progression in a way that traps the user.
  - Keep the modal-step early return in the focus-freeze/mousedown interception logic.

- If needed, make a minimal supporting adjustment in `src/components/onboarding/tourSteps.ts` or `src/components/poker/EndTableDialog.tsx`
  - Only if required to preserve step sequencing while leaving the input editable.
  - No removal of the End Table tutorial integration.

## Expected result
- User taps **Total Payout**.
- Input receives focus normally.
- Mobile keyboard opens normally.
- User can type and edit multiple digits normally.
- Tutorial remains visible and correctly positioned.
- End Table modal integration stays intact.

## Scope guard
This plan fixes **only** the Total Payout editability issue inside the End Table tutorial flow. It does not change unrelated onboarding steps or remove the modal tour integration.