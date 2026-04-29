## Goal

Stabilize the onboarding tutorial so it feels locked and professional: no background scroll, no stray interactions, tooltip never overlaps the spotlight or runs off-screen, and Advanced Options is open before any of its child steps are spotlighted.

All changes are isolated to the tour layer and `SessionForm`. No copy, button labels, or step ordering will change.

---

## 1. Scroll lock + interaction lockdown (`OnboardingTour.tsx`)

While the tour overlay is mounted (menu OR any active step):

- Add `overflow: hidden` and `touch-action: none` to `document.body` and `document.documentElement` for the lifetime of the component (cleanup on unmount). Preserve the previous values to restore on cleanup so we don't fight other modals.
- Keep the existing dim-bands approach for `interactive` steps (clicks pass through the hole) but ensure the bands cover the entire viewport with no gaps even after rect changes (the band math already handles this; we'll add `overflow: hidden` on the root overlay so any rounding won't leak).
- For non-interactive steps the existing full-screen click blocker stays.
- Add `aria-hidden="true"` and `inert` (best-effort) to `#root` siblings is not needed; the dim layer already swallows pointer events. The new body-level `touch-action: none` is what kills swipe/scroll on iOS Safari.

Result: user can ONLY interact with the spotlighted element (or the tooltip buttons), and cannot scroll the page underneath.

---

## 2. Smart, responsive tooltip placement (`OnboardingTour.tsx`)

Replace the current fixed `TOOLTIP_WIDTH = 300` and "below, else above" logic with a width- and space-aware placement:

- Compute `tooltipWidth = min(320, viewport.w - 24)` so it always fits with 12px side margins on phones.
- Decide vertical side by *largest available space* rather than just "fits below":
  - `spaceBelow = viewport.h - (spotlight.y + spotlight.h) - 16`
  - `spaceAbove = spotlight.y - 16`
  - Place on the side where `tooltipHeight + TOOLTIP_GAP` fits AND has more clearance.
  - If neither side fits, pick the larger side and clamp `top` so the tooltip never overlaps the spotlight rect (subtract/add `TOOLTIP_GAP` against the spotlight edge, then clamp into viewport with 16px margin).
- Horizontal: center on the spotlight, then clamp into `[12, viewport.w - tooltipWidth - 12]`.
- Add a final guard: if the computed tooltip rectangle still intersects the spotlight rectangle (can happen on very small screens with tall spotlights), shrink `tooltipWidth` further or scroll the target so the tooltip wins. We'll prefer scrolling the target to a position that leaves the larger of the two halves of the viewport free, then re-measure.
- Tooltip container: add responsive classes (`text-sm sm:text-base`, `p-4 sm:p-5`, `max-w-[calc(100vw-24px)]`) so font and padding scale cleanly across breakpoints.

Result: tooltip is always fully visible, never overlaps the spotlight or its action buttons, and reads cleanly on mobile / tablet / desktop.

---

## 3. Advanced Options opens before Optional Details (`tourSteps.ts`)

Per the screenshot, the "Optional Details" step is meant to spotlight the Advanced Options block. Today only `advanced-online`, `advanced-multiday`, and `advanced-late-reg` carry the `prepare: openAdvanced` hook; the `optional-details` step does not, and it points at the "First Table / Session Name" field which sits *above* the accordion.

Fix:

- Add `prepare: openAdvanced` to the `optional-details` step so the accordion expands before measurement.
- Keep the selector as `[data-tour="optional-details"]` for now (the field is the labeled "Optional details" target). With Advanced Options expanded, the spotlight + tooltip have room to lay out below without colliding with the accordion content.
- The existing `onboarding:open-advanced` listener in `SessionForm.tsx` and the 280ms settle delay already handle the expansion animation — no changes needed there.

(No new steps, no relabeling.)

---

## 4. Snap & stability (`OnboardingTour.tsx`)

The rAF-throttled `readRect` already keeps the spotlight glued to the target. Two small hardening tweaks:

- Run one extra `readRect()` on the next frame after `tooltipVisible` flips to true, so the first paint is always against the final layout (eliminates the 1-frame jump some users see after `prepare` runs).
- Add a `ResizeObserver` on the target element (when available) so changes inside the spotlighted element (e.g. the accordion finishing its open animation) immediately re-measure instead of waiting for a scroll/resize event.
- Keep `transition: all 300ms ease` on the dim bands but set `transition: none` on the very first paint per step (when `hadRectRef.current === false`) so the spotlight snaps into place on step entry instead of sliding from the previous step's coordinates.

---

## Files touched

- `src/components/onboarding/OnboardingTour.tsx` — scroll lock, lockdown, smart placement, ResizeObserver, snap-on-entry, responsive tooltip classes.
- `src/components/onboarding/tourSteps.ts` — add `prepare: openAdvanced` to the `optional-details` step.

No other files change. No copy or button labels change.
