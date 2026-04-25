# Circular Spotlight for "Start a Session" Step

## What changes
The Step 2 spotlight currently uses a rounded-rectangle SVG mask, which leaves visible empty corners around the circular green poker chip. We'll switch the mask (and the matching gold outline) to a perfect circle whenever the highlighted target is the START SESSION chip. All other steps keep the existing rounded-rectangle behavior.

## Visual behavior
- Step 2 (`[data-tour="start-session"]`): spotlight cutout is a circle, centered on the chip, sized to fit the chip with a small inner breathing-room padding so the chip's edge is fully visible inside the lit area.
- Pulse animation on the chip stays exactly as it is (already controlled via the `onboarding-pulse-active` body class — no changes there).
- Tooltip positioning logic continues to work because we'll keep the bounding box the same dimensions; only the cutout shape becomes a circle inscribed around the chip.

## Technical changes

**File: `src/components/onboarding/OnboardingTour.tsx`**

1. Add a small helper `isCircleStep` derived from `step?.selector === '[data-tour="start-session"]'`.
2. Compute a circle geometry from the existing `rect`:
   - `cx = rect.left + rect.width / 2`
   - `cy = rect.top + rect.height / 2`
   - `r = Math.max(rect.width, rect.height) / 2 + CIRCLE_PADDING` (where `CIRCLE_PADDING = 8` — small padding so the chip's edge isn't clipped by the dark overlay).
3. In the `<mask id="onboarding-spotlight-mask">`, conditionally render either:
   - `<circle cx={cx} cy={cy} r={r} fill="black" />` when `isCircleStep`, OR
   - the existing rounded `<rect>` otherwise.
4. Apply the same conditional swap for the animated gold outline below the mask: render a `<circle>` (same `cx/cy/r`) with `stroke="hsl(var(--primary))"`, `strokeWidth="2"`, and the existing drop-shadow filter when `isCircleStep`; otherwise keep the rounded `<rect>` outline.
5. Keep the existing `spotlight` bounding box used for tooltip placement unchanged so the tooltip continues to sit just below the chip.

No other files need changes. The pulse animation in `src/index.css` and the body-class toggle in the existing `useEffect` remain as-is.

## Acceptance criteria
- On Step 2, the dimmed overlay reveals a clean circular hole tightly around the green START SESSION chip with a small visible margin.
- No rounded-rectangle corners are visible around the chip.
- The gold glowing outline matches the circular shape.
- The chip continues to pulse.
- Steps 1, 3, 4… continue to use the rounded-rectangle spotlight as before.
