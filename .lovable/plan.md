## Problem

When the user taps the **Buy-in Amount** input on iOS during the Stakes tour step, the page shifts upward — the browser's native "scroll-focused-input-into-view" behavior runs even though we apply `overflow:hidden` + `height:100vh` to html/body/appRoot. The spotlight is positioned from `getBoundingClientRect()` and we currently freeze that rect on focus, so when the page silently scrolls under us, the spotlight stays pinned to viewport coordinates while the actual field moves — visually misaligning/cutting off the highlight.

`overflow:hidden` does NOT prevent iOS Safari/WKWebView from programmatically scrolling the *root* on input focus. We have to either prevent the focus-scroll itself or detect the scroll and immediately restore it.

## Fix (single file: `src/components/onboarding/OnboardingTour.tsx`)

### 1. Prevent the iOS focus-scroll at the source

In the existing freeze `useEffect` (around lines 398–499):

- On `pointerdown` / `mousedown` / `touchstart` (capture) for an editable target inside the spotlight, **snapshot scroll positions** of `window`, `documentElement`, `body`, and `[data-app-scroll-root="true"]` into a ref, then set `frozenRef.current = true` (already done).
- Intercept the tap to bypass iOS auto-scroll:
  - On `mousedown` for an editable input inside the highlighted area, call `e.preventDefault()` and then `el.focus({ preventScroll: true })`. `preventScroll` is supported in WKWebView and skips the focus-scroll-into-view side effect.
  - Use `mousedown` (not `touchstart`) because preventing default on `touchstart` blocks the synthesized click; `mousedown` fires after touchend on iOS and preventing it is safe for inputs.

### 2. Restore scroll if it slips through

Some WKWebView versions still scroll despite `preventScroll`. Add a short "scroll-guard" window:

- After `focusin` on an editable inside the spotlight, run a **rAF + 0/50/150/300ms timer chain** that re-applies the snapshot scroll positions to window/html/body/appRoot.
- Add a temporary `scroll` listener (capture, on `window` and on the appRoot) that, while the input is focused, immediately writes the snapshot back. Remove on `focusout`.

### 3. Keep the rect/tooltip frozen during the focused window

- Keep `frozenRef.current = true` for the entire duration the input is focused (already done).
- On `focusout`, after the existing 280ms delay, re-snapshot scroll positions and call `readRect()` once. (already done — keep.)
- Confirm the `visualViewport.resize` keyboard-open branch keeps `frozenRef.current = true` so the spotlight uses the cached rect even if iOS shrinks `innerHeight` (already done — keep).

### 4. Cleanup

- Remove the scroll-guard listeners and any pending timers in the effect cleanup.
- Defensive: clear `frozenRef.current = false` on unmount (already done).

## Out of scope

- No changes to tooltip text, `tourSteps.ts`, `SessionForm.tsx`, scroll-lock infrastructure, or other tour steps.
- No design system / token changes.
- No business-logic changes.

## Why this works

`preventScroll: true` plus restoring the snapshot scroll positions on every scroll event during the focus window guarantees the page does not move while the input is focused. With the page locked, the existing rect freeze keeps the spotlight and tooltip exactly where they were when the user tapped — eliminating the upward shift seen in the screenshots.
