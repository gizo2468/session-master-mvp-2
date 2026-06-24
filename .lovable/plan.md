## Tutorial Update – Active Table Step (table-actions)

### Goal
Add a Skip button to the `table-actions` tutorial step and update its title and description.

### Changes

#### 1. `src/components/onboarding/tourSteps.ts`
Update the `table-actions` step in the `start-session` path:
- Change `title` from `"Active Tables"` to `"Manage Table"`
- Change `body` from the current long text to `"Add a rebuy when needed, save hands, or end the table when you're done playing."`

#### 2. `src/components/onboarding/OnboardingTour.tsx`
In the button-rendering section (~line 1376), add `isTableActionsStep` to the existing skip-button condition so the ghost "Skip" button appears alongside the `isSubmitSessionStep` and `isLiveOverviewStep` buttons. The button already uses `handleSkipTutorial`, which ends the tutorial, marks it completed, closes the overlay, and returns to Home.

No other UI, styling, or behavior changes.
