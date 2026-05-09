## Split "Track Your Edge" into two focused steps

### 1. `src/components/poker/SessionTimerCard.tsx`

**a.** Remove `data-tour="live-scoreboard"` from the outer card wrapper (line 198).

**b.** Add a new wrapper `data-tour="live-overview"` around just the timer block + stats grid (current lines 199–259), so the spotlight covers Session Time + Started / Total Tables / Hands Saved only — excluding all action buttons.

**c.** Add `data-tour="live-add-table"` directly on the Add Table `<Button>` element (lines 264–269) so step 2 highlights only that button.

No business logic or styling changes — markup wrappers only.

### 2. `src/components/onboarding/tourSteps.ts`

In the `start-session` array, replace the existing `live-scoreboard` step with two consecutive steps placed before the existing `live-actions` step:

```ts
{
  selector: '[data-tour="live-overview"]',
  title: 'Live Session Tracking',
  body: 'Monitor your total session duration and overall investment in real-time.',
  interactive: true,
  route: '/session',
  compact: true,
},
{
  selector: '[data-tour="live-add-table"]',
  title: 'Expand Your Session',
  body: 'Quickly add new tables or tournaments to your active session as you play.',
  interactive: true,
  route: '/session',
  compact: true,
},
```

The existing `live-actions` ("Stay Active") and `live-controls` ("Finishing Up") steps remain unchanged and follow these.

### Why this addresses the request

- Tight `live-overview` wrapper means the spotlight box only covers the timer + buy-in/stat rows, leaving room below for the tooltip so it doesn't overlap the timer.
- `live-add-table` targets only the Add Table button, keeping the highlight tightly fitted.
- Sequential ordering preserves the Next/Previous flow: Overview → Add Table → Stay Active → Finishing Up.
