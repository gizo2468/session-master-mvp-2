## Goal
Shrink the "Session Overview" tutorial highlight to focus only on the top metadata block of the Session Details card, so the tooltip fits comfortably below it. Keep title, copy, and all other steps unchanged.

## Changes

### 1. `src/components/poker/SessionDetailsCard.tsx`
- Remove `data-tour="live-session-details"` from the outer `<Card>` (line 82).
- Add a new inner wrapper `<div data-tour="live-session-details">` that wraps:
  - the existing `<CardHeader>` (title "Session Details" + optional location subtitle), and
  - the top metadata rows only: **Format**, **Game Type**, **Currency** (and the optional Online physical-location / Festival rows that sit alongside them).
- The Share with Coach button, sharing status, summary pills (Total Buy-Ins, Total Payouts, multi-day), Profit/Loss, multi-day details, and Notes stay **outside** the wrapper so they aren't highlighted.

This restricts the spotlight to roughly the area shown in the user's screenshot (header + Format/Game Type/Currency).

### 2. Tooltip position — no code change needed
`OnboardingTour.tsx` already places the tooltip below the spotlight whenever there is room (`placeBelow` rule at lines 754-760), with `TOOLTIP_GAP = 16px` padding. Once the highlight is reduced to just the top block, there will be ample space below, so the tooltip will naturally render below the highlighted area without overlapping the rest of the card.

### 3. Untouched
- `tourSteps.ts`: the `live-session-details` step (selector, title, body, `compact: true`) stays exactly as is.
- The "Stay Active" step and every other tutorial step are not modified.
- No styling/visual changes to `SessionDetailsCard` (only an extra wrapping `<div>` around existing children).

## Verification
- Manually confirm in the live tour that the gold spotlight now covers only the header + Format/Game Type/Currency rows, and the tooltip sits below with a clean gap.
