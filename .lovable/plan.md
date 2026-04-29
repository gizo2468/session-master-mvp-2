## Goal

Force the onboarding tooltip to **always sit below the spotlighted element**, with zero overlap and clean centering. Only flip above when there is genuinely no room below.

## The Problem

Current placement logic (`OnboardingTour.tsx`, ~lines 426-439) picks the side with *more* available space. On the home screen the START SESSION chip sits roughly mid-viewport, so the algorithm flips the tooltip above the chip — and because the chip is large, the tooltip card visually overlaps the spotlight (see screenshot). The rule "below by default, flip only when impossible" is not implemented.

Additional issues:
- The pulsing tap-hand uses `zIndex: 2` but the tooltip is a sibling rendered later in the DOM with a much higher effective stacking. The tap-hand needs to be guaranteed on top of the tooltip's layer so the user always sees the interaction cue clearly.
- No hard guard preventing the tooltip rect from overlapping the spotlight rect when "below" is forced and space is tight.

## Changes (single file: `src/components/onboarding/OnboardingTour.tsx`)

### 1. Rewrite tooltip placement to "below-first"

Replace the `placeBelow = (fitsBelow && ...) || ...` heuristic with a strict rule:

```ts
const required = tooltipHeight + TOOLTIP_GAP + VIEWPORT_MARGIN;
const spaceBelow = viewport.h - (spotlight.y + spotlight.h);
const spaceAbove = spotlight.y;

// Default: below. Only flip above when below physically cannot fit
// AND above has meaningfully more room.
const placeBelow = spaceBelow >= required || spaceBelow >= spaceAbove;
```

Then when `placeBelow` is true, always anchor at `spotlight.y + spotlight.h + TOOLTIP_GAP` and clamp downward only — never let `top` go above the spotlight bottom edge:

```ts
if (placeBelow) {
  const anchor = spotlight.y + spotlight.h + TOOLTIP_GAP;
  // Allow the tooltip to extend past the viewport bottom rather than overlap
  // the spotlight. The card is scrollable/visible via 90vw width clamp.
  top = anchor;
} else {
  top = Math.max(VIEWPORT_MARGIN, spotlight.y - TOOLTIP_GAP - tooltipHeight);
}
```

This guarantees zero overlap with the spotlight.

### 2. Center-align horizontally (already done, verify)

Keep current logic:
```ts
let left = spotlight.x + spotlight.w / 2 - tooltipWidth / 2;
left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewport.w - tooltipWidth - VIEWPORT_MARGIN));
```
No change needed — it already centers and clamps.

### 3. Z-index hierarchy fix

Current order in the overlay container (z-[100]):
- bands (no z) → SVG stroke (no z) → tap-hand (z:2) → tooltip card (no z)

The tooltip ends up on top of the tap-hand because of DOM order. Fix by:
- Setting tap-hand `zIndex: 20` (stays above everything in the overlay).
- Setting tooltip card `zIndex: 10`.
- Setting SVG stroke wrapper `zIndex: 5`.

Result: spotlight outline < tooltip < tap-hand, while the actual UI element under the spotlight remains fully visible (the bands have a hole over it).

### 4. Reduce TOOLTIP_GAP slightly on small viewports

Keep `TOOLTIP_GAP = 16`. No change unless QA shows it's too tight — current value is fine.

## Out of Scope

- Text content, button labels, step copy: untouched.
- Scroll lock logic (already working per the user).
- `tourSteps.ts`, `AppLayout.tsx`, `SessionForm.tsx`: no changes.

## Acceptance

- On the home screen with the START SESSION chip highlighted, the tooltip appears **below** the chip with a clean ~16px gap and the chip is fully visible (matches the reference image).
- The tap-hand pulsing icon renders on top of all overlay layers.
- Across all 11 tour steps, the tooltip never visually overlaps the spotlight rectangle.
- The tooltip flips above only when the spotlighted element is near the bottom of the viewport (e.g., bottom action bar on `/session`).
