## Plan: Move Session Details Highlight to Investment Section + Update Text

### 1. `src/components/poker/SessionDetailsCard.tsx`
- Remove `data-tour="live-session-details"` from the inner `<div>` wrapping the header/metadata (line 83).
- Add `data-tour="live-session-details"` to the summary pills container (line 188), the `<div className="flex flex-row flex-wrap ... gap-2 mt-1 mb-1">` that holds **Total Buy-Ins**, **Total Payouts**, and the multi-day badge. This centers the highlight on the investment area exactly as requested.

### 2. `src/components/onboarding/tourSteps.ts`
Update the "Session Overview" step (currently between "Stay Active" and "Manage Your Games"):
- **Title:** `Session Details`
- **Body:** `Here you can find all the essential information about your session, including game settings, location, and your total investment at a glance.`
- Keep `interactive: true`, `route: '/session'`, `compact: true`. No flow/order changes.

### 3. Tooltip positioning
No changes needed. The existing `OnboardingTour` logic places the tooltip below the spotlight when there's room; the buy-in pills sit lower in the column so the tooltip will naturally render below or above without overlap, and Previous/Next remain functional.

### Untouched
- Other tour steps, `OnboardingTour.tsx`, layout/styling of `SessionDetailsCard`, all other components.