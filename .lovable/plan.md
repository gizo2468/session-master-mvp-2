## Goal

Make the **Back** button on the New Session page (and any other element we explicitly mark) clickable while the onboarding tour is active, and guarantee that every scroll/interaction lock is released the moment the tour unmounts.

## Root cause

`OnboardingTour.tsx` renders four full-width dim "bands" around the spotlight for `interactive` steps. Each band is `pointer-events: auto` with `onClick={stopPropagation}`. On the "Define Your Game" step the Back button is geometrically inside the **top** band, so the band swallows the tap before it can reach the button.

## Changes

### 1. `src/components/onboarding/OnboardingTour.tsx` — let opted-in elements stay clickable

- Introduce a small helper `isInsideAllowed(target)` that returns true when the click target is inside an element with `data-tour-allow="true"` (or one of its ancestors).
- In each band's `onClick`, **only** call `stopPropagation` when the click is *not* inside an allowed element. Allowed clicks fall through to the underlying button.
- In the wheel/touchmove/keydown blockers (lines ~253–264), apply the same exception so a tap on the Back button isn't cancelled by `preventDefault`.
- In the full-screen click blocker for non-interactive steps (line 538), do the same allowed-element check.

### 2. `src/components/onboarding/OnboardingTour.tsx` — raise allowed elements above the overlay

- Add a one-time effect that, while the tour is mounted, finds every `[data-tour-allow="true"]` element and applies inline `position: relative; z-index: 101; pointer-events: auto;`. On cleanup (unmount, route change, dismiss) it restores the previous inline values.
- This guarantees the Back button is visually above the dim band as well as logically clickable.

### 3. `src/pages/SessionForm.tsx` — mark the Back button

- Add `data-tour-allow="true"` to the existing Back button (the `<Button variant="ghost">` near the top of the page that calls `navigate(-1)` / fallback `/`).
- No other behavior changes.

### 4. Hardening cleanup ("Reset State")

Verify the existing cleanup in `OnboardingTour.tsx`:
- The lock effect (lines 225–277) already restores `overflow / height / touchAction / overscrollBehavior` on `html`, `body`, and `[data-app-scroll-root]`, and removes wheel/touchmove/keydown listeners on unmount.
- The pulse effect (lines 298–307) already removes `onboarding-pulse-active`.
- Add an extra safety net: a top-level `useEffect(() => () => { ... }, [])` that, on unmount, force-clears any leftover inline `overflow`, `height`, `touchAction`, `overscrollBehavior` on `html`, `body`, and `[data-app-scroll-root]` and removes `onboarding-pulse-active`. This protects against edge cases where the lock effect's prev-value restore doesn't fully clear styles (e.g. if the tour unmounts mid-transition).

## Out of scope

- Tooltip positioning, scroll-into-center logic, and band/spotlight geometry — all unchanged.
- `tourSteps.ts` — no step changes; the existing `data-tour-allow` mechanism is generic and reusable for future "must remain clickable" elements (e.g. a global Skip button, header nav).

## Acceptance

- On `/new-session` while the tour is at the "Define Your Game" / "Set the Stakes" / etc. steps, tapping **Back** navigates home immediately.
- Back button is visually visible (not dimmed) above the overlay.
- After dismissing the tour or navigating away, `html`/`body` have no leftover `overflow:hidden / height:100vh`, the page scrolls normally, and no event listeners remain attached.