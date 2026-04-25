## Goal

Make the Step 2 (Start a Session) spotlight interactive: the user can click the green START SESSION chip directly through the dimmed overlay. Clicking it triggers the chip's normal navigation AND closes the onboarding tour at the same time.

## Changes

### 1. `src/components/onboarding/OnboardingTour.tsx`

**a. Allow pointer events to pass through the spotlight cutout (Step 2 only).**

Currently the root overlay container uses `pointer-events-auto` and the SVG backdrop has `pointerEvents: 'auto'`, which blocks every click — including the cutout area.

For the interactive step (`[data-tour="start-session"]`):
- Set the root container to `pointer-events-none` so the page underneath receives clicks by default.
- Keep the SVG dark backdrop `pointer-events: auto` over the dimmed area, but render the circular cutout as a separate transparent `<circle>` (or sized div) with `pointer-events: none` on top, so clicks within the circle fall through to the chip.
- Re-enable `pointer-events: auto` on the tooltip card so its buttons (Skip / Previous / Next) still work.

The simplest robust approach: instead of one full-screen rect, render the dim as four rectangles surrounding the spotlight circle (top / bottom / left / right bands), each with `pointer-events: auto`. The hole in the middle naturally has no element, so clicks pass through to the chip. Keep the gold stroke `<circle>` with `pointer-events: none`.

**b. Detect click on the highlighted element and dismiss the tour.**

Add a `useEffect` (active only on the `[data-tour="start-session"]` step) that:
- Queries the highlighted element (`document.querySelector(step.selector)`).
- Attaches a one-shot `click` listener that calls `onClose()` (the chip's own `onClick` will navigate as normal — we do not preventDefault).
- Cleans up on step change / unmount.

This ensures the tour closes the moment the chip is tapped, while the chip's existing `NewSessionButton` navigation runs naturally.

### 2. `src/pages/Index.tsx`

Update Step 2 tooltip text in `tourSteps`:

```ts
{
  selector: '[data-tour="start-session"]',
  title: 'Start a Session',
  body: 'Click the chip to start your first session and see the app in action!',
},
```

## Technical notes

- For non-interactive steps (1, 3, 4) behavior is unchanged — full-screen dim with no clickthrough.
- The four-band dim approach avoids SVG mask pointer-event quirks (a masked SVG element still captures pointer events over the cutout in most browsers).
- The tooltip card already uses absolute positioning with its own `pointerEvents: 'auto'`, so making the root `pointer-events-none` on the interactive step does not break the Skip/Previous/Next buttons.
- No changes to `useOnboardingTour` — `dismiss()` already persists the seen flag, so tapping the chip permanently completes the tour.
