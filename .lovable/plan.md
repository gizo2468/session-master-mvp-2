## Update Tutorial Tooltip — Session Name Step

Update the "Optional Details" tour step in `src/components/onboarding/tourSteps.ts` (the step targeting `[data-tour="optional-details"]`):

1. **Title**: change from `"Optional Details (Optional)"` → `"Session Name"`.
2. **Body**: change to `"Give your session a custom name to easily identify it in your history later."`
3. **Compact UI**: set `compact: true` on this step so it uses the tighter padding/gap styling already supported by `OnboardingTour.tsx` (matching the Session Settings step).

No other steps, selectors, or flow logic change. The tooltip remains anchored to the Session Name input via the existing `[data-tour="optional-details"]` selector.