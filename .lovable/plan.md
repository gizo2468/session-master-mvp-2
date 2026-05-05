## Problem

When the tutorial advances to a step whose target is below the fold (e.g. "Stakes", "Optional Details", "Submit Session" on `/new-session`), the page does not scroll. The spotlight gets drawn off-screen and the user is stuck.

## Root cause

`OnboardingTour.tsx → scrollTargetIntoCenter()` tries to scroll by:
1. Temporarily setting `overflow = ''` on `<html>`, `<body>`, and `[data-app-scroll-root]`.
2. Calling `el.scrollIntoView({ block: 'center' })`.
3. Restoring `overflow = 'hidden'` on the next frame.

This does not work in this app because `AppLayout` is `fixed inset-0 overflow-y-auto` — i.e. the **only real scroll container** is the app-scroll-root div. When the lock effect sets that div's inline `overflow: hidden` plus `height: 100vh`, then the temporary release sets `overflow: ''`, which makes the div "visible" overflow. At that moment there is no scrollable ancestor for `scrollIntoView` to act on (html/body are not scrollable in this layout), so the call is a no-op. By the next frame the lock is reapplied — net result: zero scroll.

The screen replay confirms it: the user is on `/new-session` showing the "Define Your Game" step, and pressing Next never moves the page to bring later targets into view.

A second, smaller issue: the lock `useEffect` has an empty dependency array, but `tooltipRef.current` is captured by closure inside `isInsideTooltip`. That's fine, but the ResizeObserver is not the issue here — the scroll path is.

## Fix

Rewrite `scrollTargetIntoCenter` to scroll the real scroll container **without unlocking it**. `overflow: hidden` does not block programmatic `scrollTo` / `scrollTop` writes, so we can keep the user-level scroll lock fully intact while still moving the page.

Logic (in `src/components/onboarding/OnboardingTour.tsx`):

1. Find the scroll container: `document.querySelector('[data-app-scroll-root="true"]')`. Fallback to `document.scrollingElement` if absent.
2. Read the target rect (`getBoundingClientRect`) and the container rect.
3. Compute the desired delta so the target's vertical center aligns with the container's vertical center:
   `deltaY = (targetRect.top + targetRect.height / 2) - (containerRect.top + containerRect.height / 2)`
4. Apply `container.scrollTop += deltaY` (clamped to `[0, scrollHeight - clientHeight]`). Use `scrollTo({ top, behavior: 'auto' })` so it snaps instantly (matches the existing "no smooth drift" rule).
5. Wait one rAF, then `readRect()` and reveal the tooltip (existing two-rAF pattern preserved).
6. Do **not** mutate `overflow`, `height`, `touchAction`, or `overscrollBehavior` here. The mount-time lock effect remains the single source of truth for those styles.

Also harden the same function so it works on `/` (Index) and `/session` if the scroll root differs — by always querying at call time, never caching.

## Validation

- Step 2 → 3 transition on `/new-session`: page snaps so "Stakes" is centered, spotlight aligns, tooltip appears below.
- Steps 4–7 (Optional Details, Online, Multi-day, Late Reg, Submit): all scroll into center, including after `prepare()` opens the Advanced accordion.
- Manual scroll (wheel/touch/keys) remains blocked — the existing event blockers and overflow lock are untouched.
- Closing the tour (Skip / Done / route change) still releases all locks via the existing cleanup effect (no behavior change there).
- Back button on `/new-session` continues to work (no changes to that path).

## Files to update

- `src/components/onboarding/OnboardingTour.tsx` — replace `scrollTargetIntoCenter` with the container-relative scroll implementation; keep all other tour logic (locks, blockers, tooltip placement, `data-tour-allow` lift) unchanged.
