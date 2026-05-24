## Problem

In the End Session sheet, the tutorial spotlight for the **Session Summary** step renders around the first stats row (`Total Buy-in / Total Cash-out`) instead of around the gold “Session Summary” title at the top of the card.

The `data-tour="end-session-summary"` attribute currently lives on the title's flex *row* wrapper (`<div class="flex items-center justify-center gap-2 mb-3">`). That wrapper is a block-level flex container that stretches the full width of the card. On the mobile viewport in question its measured `getBoundingClientRect()` is ending up taller and lower than the visible icon + text, which is why the spotlight rectangle sits over the stats row below.

## Fix

Move the `data-tour="end-session-summary"` anchor off the wrapper row and onto the **`<span>`** that actually renders the words “Session Summary”. A `<span>` is inline by default, so its bounding rect is exactly the text glyphs — narrow, short, and unambiguously centered at the top of the card. With the spotlight's built-in 10px padding this produces a small, balanced pill around the title text, exactly where the user expects.

### Single change

File: `src/components/poker/EndSessionSheet.tsx` (lines 144-147)

Before:

```tsx
<div data-tour="end-session-summary" className="flex items-center justify-center gap-2 mb-3">
  <DollarSign size={20} className="text-poker-gold" />
  <span className="font-medium text-poker-gold">Session Summary</span>
</div>
```

After:

```tsx
<div className="flex items-center justify-center gap-2 mb-3">
  <DollarSign size={20} className="text-poker-gold" />
  <span
    data-tour="end-session-summary"
    className="font-medium text-poker-gold"
  >
    Session Summary
  </span>
</div>
```

## Out of scope

- No changes to `src/components/onboarding/OnboardingTour.tsx` (placement logic stays as-is — `placement: 'above'` is correct).
- No changes to `src/components/onboarding/tourSteps.ts`.
- No changes to the modal design, the card layout, the stats grid, the End Session button, or any session-end behavior.
- No changes to any other tour step.

## Expected result

- Spotlight rectangle is small and tightly hugs the “Session Summary” title text, centered horizontally inside the card.
- Tooltip (already set to `placement: 'above'`) continues to sit above the spotlight, fully visible on the 390×540 viewport.
- The stats grid, totals, notes, and End Session button remain visually untouched and undimmed inside the sheet.
