## Add Skip Button to "Define Your Game" Step Only

Edit `src/components/onboarding/OnboardingTour.tsx` in the buttons row (around lines 1043-1049):

1. Detect the current step as the "Define Your Game" step via `step.selector === '[data-tour="game-setup"]'` (store as `isGameSetupStep`).
2. Inside the right-side button group, render a `Skip` button **only when `isGameSetupStep` is true**, placed to the left of the existing `Next` button:
   ```tsx
   {isGameSetupStep && (
     <Button variant="ghost" size="sm" onClick={handleSkip}
       className="text-muted-foreground hover:text-foreground hover:bg-transparent">
       Skip
     </Button>
   )}
   ```
3. `handleSkip` already exists (line 632) and calls `onClose()`, which closes the tour — reuse it.
4. The `Skip` and `Next` buttons share the same `flex items-center gap-2` container, so they remain vertically aligned with consistent spacing.

No changes to `tourSteps.ts` or any other step. No changes to business logic.
