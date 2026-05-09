## Hide "Previous" on the Live Session Tracking step

In `src/components/onboarding/OnboardingTour.tsx`:

- Add a new flag identifying the Live Session Tracking step:
  ```ts
  const isLiveOverviewStep = step?.selector === '[data-tour="live-overview"]';
  ```
- Update `hidePreviousButton` to include it:
  ```ts
  const hidePreviousButton = isGameSetupStep || isLiveOverviewStep;
  ```

The existing render branch at line ~1032 already handles `hidePreviousButton` (renders a spacer in place of the Previous button so the Next button stays right-aligned within the tooltip's flex layout — matching how the "Define Your Game" step behaves today). No layout changes needed; the Next button will sit on the right side of the tooltip exactly like on the game-setup step.

No changes to other steps, tour flow, or `tourSteps.ts`.