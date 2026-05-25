# Plan

Update the final End Session tutorial flow so the "Review Your Session" step has no Next button and is only advanced by tapping the real red **End Session** button, with the animated hand indicator pointing at that button.

## What I'll change

1. **`src/components/onboarding/tourSteps.ts`**
   - Remove the now-redundant `"Save Your Session"` step (selector `end-session-confirm`). The "Review Your Session" step becomes the final step of the End Session flow.
   - Keep "Review Your Session" copy and its `end-session-summary` selector (so the spotlight still frames the recap panel), keep Previous working.

2. **`src/components/onboarding/OnboardingTour.tsx`**
   - Treat the `end-session-summary` step as the "tap real End Session to advance" step:
     - Add it to `hideNextButton` so Next is removed.
     - Add it to `showTapHand` and anchor the animated hand indicator to the real `[data-tour="end-session-confirm"]` button (not the summary panel spotlight target).
   - Keep Previous button visible/working (do not add to `hidePreviousButton`).
   - Ensure the existing "real button click advances tour" wiring (already used by `end-session-confirm`) is applied when on the `end-session-summary` step — clicking the real red End Session button completes the tour as the last step, and the existing End Session flow returns the user to Home as today.

3. **No business-logic changes** to `EndSessionSheet` — the End Session button keeps its current real behavior. The tutorial just hooks into its click to advance/complete the tour.

## Result

- "Review Your Session" step shows: spotlight on the recap, Previous button, no Next button, animated hand pointing at the real red End Session button.
- Tapping the real End Session button ends the session and returns to Home (unchanged), and naturally completes the tour because it's now the last step.
- Outside the tutorial, End Session behavior is unchanged.

## Technical notes

- Reuse existing hand-indicator and "hide Next" patterns already used for `end-session-confirm`, just retarget them at the `end-session-summary` step and anchor the hand to the `end-session-confirm` element.
- No changes to `EndSessionSheet.tsx`, routing, or session-end logic.
