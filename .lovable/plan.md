## Goal

Resize the "Session Details" tutorial spotlight so the gold rectangle covers the column from the **Format** row down through the **Total Buy-Ins** badge, without including the "Session Details" title at the top.

## Current state

In `src/components/poker/SessionDetailsCard.tsx`:
- The `data-tour="live-session-details"` attribute is currently on the inner pills container (line 188), so only the Total Buy-Ins / Payouts badges are highlighted.
- The metadata rows (Format, Game Type, Currency, Location, Festival) live in a separate block on lines 92–136.
- The "Share with Coach" button and summary pills live inside `<CardContent>` (lines 138–188+), as a sibling of the metadata block.

To highlight Format → Total Buy-Ins as one rectangle, the metadata block and the pills container need to share a single wrapper element.

## Change

In `src/components/poker/SessionDetailsCard.tsx`:

1. **Remove** `data-tour="live-session-details"` from the summary pills `<div>` on line 188.
2. **Wrap** the metadata block (`<div className="px-6 pb-2">…</div>`, lines 92–136) **and** the existing `<CardContent>` (lines 138 to its closing tag) inside a single new `<div data-tour="live-session-details">…</div>`.
   - The "Session Details" title (`<CardHeader>`) stays **outside** this wrapper so it is not part of the highlight.
   - "Share with Coach" button and the optional "Shared With" row sit between Format and Total Buy-Ins inside the column already, so they are naturally inside the new wrapper. This matches the visual area the user requested.

No changes to copy, ordering, styles, or `tourSteps.ts`.

## Tooltip placement

`OnboardingTour` automatically positions the tooltip above or below the spotlight depending on available space. Because the new highlight is centered vertically in the column, the tooltip will continue to render with adequate padding above or below it without overlapping the highlighted content. No tour-config change needed.

## Files touched

- `src/components/poker/SessionDetailsCard.tsx` (single wrapper restructure)
