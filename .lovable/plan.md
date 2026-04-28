# Add "Optional Details" Onboarding Step

## What changes

A new onboarding tutorial step is inserted on the Start New Session page, between the existing "Set the Stakes" step and the final "You're All Set!" step. It spotlights the **First Table / Session Name** input (which has the "Venue or site" placeholder), explaining that naming the session/table is optional but helpful for history lookup.

The tour now has 9 steps total instead of 8. The page indicator dots automatically reflect the new count (already derived from `TOUR_STEPS.length`).

## Step content

- **Title:** Optional Details (Optional)
- **Body:** Give your session or first table a custom name so it's easier to find in your history. You can also log the location or online poker site here. Don't worry, you can skip this if you're in a rush!
- **Footer:** Default — Skip (left), Previous + Next (right), dots below. The user can type or skip; Next advances to the final step.

## Implementation

### `src/pages/SessionForm.tsx`
Add `data-tour="optional-details"` to the FormItem wrapping the "First Table / Session Name" field (around line 670), so the spotlight targets that input block.

### `src/components/onboarding/tourSteps.ts`
Insert a new step into `TOUR_STEPS` between the current `[data-tour="stakes"]` step and the `[data-tour="submit-session"]` step:

```ts
{
  selector: '[data-tour="optional-details"]',
  title: 'Optional Details (Optional)',
  body: "Give your session or first table a custom name so it's easier to find in your history. You can also log the location or online poker site here. Don't worry, you can skip this if you're in a rush!",
  interactive: true,
  route: '/new-session',
},
```

### `src/components/onboarding/OnboardingTour.tsx`
No changes required. The existing footer logic already renders Skip + Previous + Next + dots for any non-first, non-last, non-game-setup, non-final-CTA step. The "hide Previous on game setup" rule (selector `[data-tour="game-setup"]`) does not match the new selector, so Previous appears as expected.

## Notes

- The new step sits at index 4 (0-based) in the steps array, pushing the final "You're All Set!" step from index 4 to index 5. Step persistence in `useOnboardingTour` is index-based; users mid-tour will see indices shift by one, but in practice only freshly-started tours go through these steps in order, so impact is negligible.
- The spotlight wraps the entire FormItem (label + input), giving a clean rounded-rectangle highlight around the labelled field.
