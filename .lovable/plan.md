I investigated the tour flow on `/new-session` and found the main issue: the Start Session guide includes steps whose targets only exist in specific form states, especially the tournament-only advanced options (`advanced-multiday`, `advanced-late-reg`). On the default cash-game form, those elements do not exist, so when the user taps Previous from the final `submit-session` step, the tour moves backward to a missing step and then auto-skips forward again. That makes the tour look stuck and makes Previous feel broken.

## Plan

1. Make the tour navigation direction-aware
- Update `OnboardingTour` so unavailable targets are skipped in the direction the user requested.
- If the user presses Previous, the tour should search backward for the nearest valid step instead of falling back into a forward auto-skip loop.
- If the user presses Next, it should search forward for the next valid step.

2. Stop relying on “missing target -> jump forward” as the main recovery path
- Replace the current retry-then-advance behavior with a more explicit “resolve next valid step” flow.
- Keep a small retry window for elements that are about to render after a `prepare()` hook, but only skip after checking whether the step is truly unavailable.
- Prevent repeated re-entry into the same invalid step so the UI cannot appear frozen.

3. Align conditional session-form steps with the actual form state
- Add step availability logic for `SessionForm` so tournament-only steps are only included when the form is in tournament mode, or programmatically switch the form into the required state before those steps run.
- I’ll use the approach that best matches the intended walkthrough while preserving the user’s current inputs.

4. Verify tooltip flow on the problematic final steps
- Re-check the `submit-session` step and the advanced options sequence to ensure:
  - Previous takes the user to a visible prior step
  - Next continues normally
  - the tour does not bounce back to the same card
  - the highlight and tooltip remain correctly positioned on mobile

## Technical details
- Files likely involved:
  - `src/components/onboarding/OnboardingTour.tsx`
  - `src/pages/SessionForm.tsx`
  - possibly `src/components/onboarding/tourSteps.ts`
- Root cause:
  - the tour step list contains selectors that are conditionally absent from the DOM
  - `focusAndMeasure()` currently resolves missing targets by moving forward, which breaks backward navigation semantics
- Expected result after fix:
  - Previous works consistently
  - no “stuck on You’re All Set” loop
  - hidden conditional steps no longer trap the tour