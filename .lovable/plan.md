Two small changes to the onboarding tour:

1. **Update description text** in `src/components/onboarding/tourSteps.ts` for the `live-overview` step:
   - Replace: `"Monitor your total session duration and overall investment in real-time."`
   - With: `"Track your session time, active tables, and saved hands in real-time."`

2. **Add conditional "Skip Tutorial" button** in `src/components/onboarding/OnboardingTour.tsx`:
   - Render a ghost-style "Skip Tutorial" button only when `isLiveOverviewStep` is true.
   - Place it in the right-side button container, before the existing "Next" button.
   - Wire it to the existing `handleSkipTutorial` handler (`onClose()` + `navigate('/', { replace: true })`).
   - Use the same muted-foreground styling already used by the game-setup "Skip" and submit-session "Skip Tutorial" buttons.
   - No changes to other steps. The button is isolated to the Live Session Tracking step only.

This follows the exact same pattern already implemented for the "You're All Set!" step's Skip Tutorial button.