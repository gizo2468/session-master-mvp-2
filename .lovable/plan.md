## Fix Session Summary tutorial step positioning

### Problem
On a 390×540 viewport the End Session sheet's Session Summary card is ~310px tall and occupies almost the entire visible modal area. The current tour step targets the whole card and uses `placement: 'below'`, so:
- The gold spotlight ring wraps the entire card and visually reads as "the whole modal is highlighted."
- The tooltip is anchored just below the card, which is off-screen (or hidden behind Cancel/End Session buttons), so the explanation text is not visible.

### Fix (single file change)

`src/components/onboarding/tourSteps.ts` — the `end-session-summary` step:

- Change `placement: 'below'` to `placement: 'above'`.

That alone is not enough because the card is too tall and the spotlight will still feel like it covers the whole modal. So additionally, in `src/components/poker/EndSessionSheet.tsx`, move the `data-tour="end-session-summary"` attribute off the outer card wrapper (line 142) and onto the inner header row that contains the gold "Session Summary" title (line 144 — the `<div className="flex items-center justify-center gap-2 mb-3">`).

Result:
- Spotlight tightly hugs only the "Session Summary" gold title row at the top of the card (a small, unambiguous highlight that clearly identifies the section without swallowing the modal).
- With `placement: 'above'`, the tooltip floats just above that title row, sitting in the empty space below the sheet header — fully on-screen.
- The rest of the card (totals, duration, etc.) remains fully visible directly under the highlighted title, so users still see the whole summary they're being asked to review.

### Out of scope
- No changes to the modal layout, copy, totals, or End Session behavior.
- No changes to tooltip sizing or to any other tour step.
- No changes to the `end-session-confirm` step.

### Files touched
- `src/components/poker/EndSessionSheet.tsx` (move `data-tour` attribute)
- `src/components/onboarding/tourSteps.ts` (flip placement to `above`)
