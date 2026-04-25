## Update Step 1 onboarding copy

Update the first tour step's title and description in `src/pages/Index.tsx` (lines 75-76) to a more welcoming, professional version.

### Change
In the `tourSteps` array, replace the first step's content:

- **Title**: `Welcome to Session Master` (unchanged)
- **Body** (new): `We're glad to have you here! Before you jump into the action, let's take a quick 30-second tour to show you where everything is and how to track your first winning session.`

### Layout / "Next" button visibility
The tooltip in `OnboardingTour.tsx` already uses a fixed 300px width with the footer row `[dots] [Skip] [Next]` (Previous is hidden on Step 1 via `!isFirst`). The longer body text will simply add 1–2 lines of vertical height — the `Next` button stays in the same footer row, fully visible. No layout/CSS changes needed.

### Files touched
- `src/pages/Index.tsx` — lines 75-76 only
