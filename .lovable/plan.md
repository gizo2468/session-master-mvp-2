## Fix Session Summary highlight to frame the whole card

### Problem
`data-tour="end-session-summary"` currently sits on the inner gold-title row (line 144 of `EndSessionSheet.tsx`). The spotlight therefore hugs only the small "Session Summary" header (or, due to layout shifts, a stray middle row), so users don't perceive the summary block as one section.

### Fix (single attribute move)

`src/components/poker/EndSessionSheet.tsx`:
- Remove `data-tour="end-session-summary"` from the inner header row at line 144.
- Add it to the outer card wrapper at line 142 (`<div className="bg-gray-50 dark:bg-background rounded-lg p-4">`).

That single change makes the gold spotlight stroke trace the full rounded summary card — title, totals, duration, hands, cashouts — so it visually reads as one cohesive block.

### Tooltip positioning
Leave `placement: 'above'` for the `end-session-summary` step in `tourSteps.ts`. With the card occupying most of the 540px sheet viewport, the tooltip cannot sit fully outside the card; the existing `OnboardingTour` logic clamps it to `VIEWPORT_MARGIN` at the top so the explanation text stays fully readable above the highlighted card (matching the layout already shown in the user's screenshot). No tooltip code changes needed.

### Out of scope
- No changes to modal layout, copy, totals, or End Session behavior.
- No changes to the `end-session-confirm` step or any other tour step.
- No changes to tooltip sizing or to the OnboardingTour placement engine.

### Files touched
- `src/components/poker/EndSessionSheet.tsx` (move one `data-tour` attribute)
