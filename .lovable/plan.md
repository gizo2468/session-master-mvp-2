## Goal
Bind the tutorial spotlight to the actual gold “Session Summary” header row (icon + title) so the highlight stays locked to that header only, not the stats below it.

## Plan
1. Update the Session Summary header in `src/components/poker/EndSessionSheet.tsx` so the tour target is attached to a dedicated shrink-to-fit title element that wraps the icon and text together.
2. Keep the existing tooltip configuration and modal layout unchanged.
3. Verify that the spotlight now measures only the header row and remains visually centered on the title/icon row.

## Technical details
- Replace the current text-only anchor with a dedicated `inline-flex` header target around:
  - the `DollarSign` icon
  - the “Session Summary” label
- Apply the `data-tour="end-session-summary"` attribute to that dedicated header target, not the surrounding full-width container and not the text span alone.
- Keep spacing balanced with small internal padding so the spotlight box is symmetrical around the row.
- Do not change:
  - `src/components/onboarding/tourSteps.ts`
  - tooltip placement logic in `src/components/onboarding/OnboardingTour.tsx`
  - modal structure, card content, or stats layout

## Expected result
- The highlight locks directly to the visible Session Summary title/icon row.
- The rectangle no longer sits too low or catches the stats area.
- Tooltip layout stays exactly as it is now.