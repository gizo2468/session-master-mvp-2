# Step 5 — Force Start Session to Continue Tour

## What changes for the user

On the final setup step ("You're All Set!"):
- The tooltip footer shows only **Skip** and **Previous** — the **Next/Done** button is removed.
- The only way to advance the tour is to click the actual golden **Start Session** button on the form.
- After the session is created, the tour persists and continues onto the Live Session dashboard (Step 6: "Track Your Edge"). It does NOT end here.

## Implementation

### 1. `src/components/onboarding/OnboardingTour.tsx`
- Add a flag `isSubmitSessionStep` for `selector === '[data-tour="submit-session"]'`.
- Generalize the existing `Next` button hide condition so it hides when either `isStartSessionStep` OR `isSubmitSessionStep` is true. The Skip and Previous buttons remain visible and functional as today.

### 2. `src/pages/SessionForm.tsx` (no functional change needed — verify only)
Already correct: `onSubmit` calls `setTourStep(tourStep + 1)` instead of `dismissOnboardingTour()` when a session is successfully created. This advances the tour to Step 6 ("Track Your Edge") on `/session`, where `LiveSession.tsx` already renders `OnboardingTour` for `/session`-route steps. No edits required here.

### 3. No new state, no CSS, no new dependencies
The submit step is already `interactive: true` in `tourSteps.ts`, so the underlying golden Start Session button remains clickable through the spotlight. Removing the Next button simply forces the user to use it.

## Files to edit
- `src/components/onboarding/OnboardingTour.tsx` — add `isSubmitSessionStep` flag and include it in the Next-button hide condition.
