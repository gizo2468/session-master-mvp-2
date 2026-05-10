## Insert two tutorial steps between "Stay Active" and "Finishing Up"

### 1. Add tour anchor attributes
- `src/components/poker/SessionDetailsCard.tsx`: add `data-tour="live-session-details"` to the outer container of the Session Details card.
- `src/components/poker/LiveSessionTables.tsx`: add `data-tour="live-active-tables"` to the outer "Active Tables" section container.

### 2. Insert two new steps in `src/components/onboarding/tourSteps.ts`
Insert between the existing `live-actions` ("Stay Active") step and the `live-controls` ("Finishing Up") step:

```ts
{
  selector: '[data-tour="live-session-details"]',
  title: 'Session Overview',
  body: 'View your session timer and key metadata like game format, location, and currency settings in one place.',
  interactive: true,
  route: '/session',
  compact: true,
},
{
  selector: '[data-tour="live-active-tables"]',
  title: 'Manage Your Games',
  body: 'All your currently running tables and tournaments will appear here. You can track individual progress and update results for each one.',
  interactive: true,
  route: '/session',
  compact: true,
},
```

Because the tour navigation uses array index for Previous/Next, this automatically wires:
- Stay Active → Session Overview → Manage Your Games → Finishing Up
- Finishing Up's Previous now leads back to Manage Your Games.

No changes needed in `OnboardingTour.tsx` (the `compact` flag handles tighter spotlight; existing scroll-into-view logic applies).

### Out of scope
No styling, copy, or other tutorial steps changed.