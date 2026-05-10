## Goal

Split the current "Manage Your Games" tutorial step into two sub-steps that highlight the **top stats area** and the **bottom action buttons** of an active table card individually, with forced tooltip placement so the tooltip covers the *other* half of the card on each step.

## Changes

### 1. `src/components/onboarding/OnboardingTour.tsx`

Add a new optional `placement` field to the local `TourStep` interface:

```ts
placement?: 'auto' | 'above' | 'below';
```

In the tooltip placement block (around line 754, the `placeBelow` calculation), respect the override:

- If `step.placement === 'above'` → force `placeBelow = false`.
- If `step.placement === 'below'` → force `placeBelow = true`.
- Otherwise keep current auto logic.

No other behavior changes (gap, clamping, width all stay the same).

### 2. `src/components/onboarding/tourSteps.ts`

- Add the same optional `placement` field to the exported `TourStep` interface.
- Replace the single `live-active-tables` step inside `'start-session'` with **two** steps, keeping the existing positional order (between `live-session-details` and `live-controls`):

```ts
{
  selector: '[data-tour="table-stats"]',
  title: 'Active Tables',
  body: 'All your currently running tables and tournaments will appear here. You can track individual progress and update results for each one.',
  interactive: true,
  route: '/session',
  compact: true,
  placement: 'below', // tooltip below → covers action buttons
},
{
  selector: '[data-tour="table-actions"]',
  title: 'Active Tables',
  body: 'All your currently running tables and tournaments will appear here. You can track individual progress and update results for each one.',
  interactive: true,
  route: '/session',
  compact: true,
  placement: 'above', // tooltip above → covers stats section
},
```

Description text reused from the original step per the task requirement ("Keep the current description as is").

### 3. `src/components/poker/TableCard.tsx`

Add two new wrapper `<div data-tour="...">` elements **inside** the existing `<Card>` so the tour can target them on the first active table on the page:

- Wrap the **top stats block** (the title/meta block at lines 175–197 plus the start/duration row at 199–229, the multi-day row at 231–251, and the buy-in/blinds block at 253–382) in:

  ```tsx
  <div data-tour="table-stats"> … </div>
  ```

- Wrap the **bottom actions block** — the active-table buttons row (lines 384–419) **and** the `HandManagementPanel` wrapper (lines 496–end-of-panel, which contains the Add Hand button) — in:

  ```tsx
  <div data-tour="table-actions"> … </div>
  ```

  Only wrap when `table.isActive` is true (the inactive branch shows summary, not action buttons; we keep that branch unchanged but still need a wrapper for `Add Hand`. Simplest: wrap both the active button row and the HandManagementPanel section together; the inactive summary stays inside `table-stats` since it has no action buttons we're highlighting).

  Concretely: keep `table.isActive ? (...) : (...)` ternary intact, and wrap the **active branch's button row + the `HandManagementPanel` block** in `data-tour="table-actions"`. For inactive tables this wrapper is absent, which is fine — the tutorial only fires on a fresh live session with an active table.

`OnboardingTour` queries `document.querySelector(...)` — first match — so multiple tables don't break anything; the spotlight lands on the first table card.

### 4. Flow / navigation

No changes needed. `OnboardingTour` already wires `Previous` / `Next` through index changes and supports adding/removing steps freely, so the two new sub-steps integrate automatically. The existing skip-on-missing logic also handles the case where the page mounts without any active table (rare during this tour, but safe).

## Out of scope

- No copy changes other than the title rename and the step duplication.
- No styling, no changes to `LiveSessionTables.tsx` or any other component.
- No behavioral changes to the existing auto placement on other steps (they don't set `placement`, so they keep the current logic).