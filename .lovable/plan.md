# Hide Previous on "Define Your Game" Step

## What changes

On the "Define Your Game" step (Step 3, selector `[data-tour="game-setup"]` — first step on the Start New Session page), the **Previous** button is removed from the tooltip footer. Skip stays on the left, Next stays on the right, and the page indicator dots remain on a separate row below — same layout as before, just without the Previous button.

All other steps retain Previous as today.

## Implementation

### `src/components/onboarding/OnboardingTour.tsx`
- Add a flag `isGameSetupStep = step?.selector === '[data-tour="game-setup"]'`.
- Add a derived `hidePreviousButton = isFirst || isGameSetupStep`.
- Change the Previous render condition from `{!isFirst && ...}` to `{!hidePreviousButton && ...}`.

No other files affected. No layout/CSS changes — the existing flex row already collapses cleanly to just the Next button on the right.
