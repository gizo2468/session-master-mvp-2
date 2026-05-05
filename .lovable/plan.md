## Problem

The tour now scrolls, but it centers the spotlighted element vertically. On a short mobile viewport (538px tall), that puts the headline/element in the middle of the screen and pushes the tooltip card off the bottom — exactly what the screenshot shows for the "Stakes" step.

## Fix

In `src/components/onboarding/OnboardingTour.tsx → scrollTargetIntoCenter`, anchor the target near the **top** of the scroll container instead of the center. Replace the center math with a top-aligned offset:

```ts
const TOP_OFFSET = 80; // leaves room for spotlight padding + stroke
const deltaY = targetRect.top - containerRect.top - TOP_OFFSET;
```

Everything else (clamping to `[0, maxScroll]`, `scrollTo({ behavior: 'auto' })`, single rAF before reveal) stays the same. The tooltip placement logic already prefers below the spotlight when there is room — anchoring high guarantees that room exists, so the instructions card stays fully on screen.

## Validation

- Step 3 ("Set the Stakes"): the Buy-in / Blinds card snaps to the upper portion of the viewport; the tooltip "Set the Stakes" appears fully below it.
- Steps 4–7 (Optional Details, Online, Multi-day, Late Reg, Submit): each highlighted block lands near the top with the tooltip visible underneath.
- Steps whose target is already near the bottom of the document (no headroom to scroll further) still behave correctly because of the `Math.min(maxScroll, ...)` clamp; the tooltip's existing flip-above logic handles those edge cases.

## File to update

- `src/components/onboarding/OnboardingTour.tsx` — change the delta calculation in `scrollTargetIntoCenter` from center-alignment to top-alignment with an 80px offset. No other changes.
