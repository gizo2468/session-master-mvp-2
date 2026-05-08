# Lock the Stakes tooltip while the user types in Buy-in

## Problem

On the Stakes step, tapping the Buy-in field makes the tooltip and gold spotlight jump. Two things cause this:

1. iOS opens the soft keyboard, which fires a `resize` event and shrinks `window.innerHeight`. Our rAF tick recomputes `viewport` + `rect` and re-runs the tooltip placement math, so the card snaps to a new top/left.
2. iOS auto-scrolls focused inputs into view. Even with the app scroll root locked, the focused field can shift relative to the viewport, causing `getBoundingClientRect()` to return new values, which the rAF tick picks up and feeds into the spotlight + tooltip position.

The result is the tooltip moving away from its "directly below the highlighted block" anchor while typing.

## Goal

While the Buy-in input is focused (or any input inside the highlighted Stakes block is focused), freeze the spotlight rect, the viewport size, and therefore the tooltip position. Resume normal live tracking when focus leaves.

## Changes (single file)

**`src/components/onboarding/OnboardingTour.tsx`**

1. Add a `frozenRef = useRef(false)` flag plus a `useState` mirror so re-renders pick it up where needed.
2. Add focus tracking, scoped to the active step's selector:
   - On step change, find the spotlighted element (`document.querySelector(step.selector)`).
   - Attach `focusin` / `focusout` listeners. If the focus target is an `<input>`, `<textarea>`, or `[contenteditable]` inside that element, set frozen = true on focusin and false on focusout.
   - Also listen on `window.visualViewport` `resize`; if its height shrinks below `window.innerHeight` by > 100px (keyboard heuristic), keep frozen = true even if focus tracking missed it.
   - Clean up listeners when the step changes or component unmounts.
3. Gate the live-tracking effects on `frozenRef.current`:
   - `readRect`: early-return if frozen, so spotlight rect is preserved.
   - The `resize` handler: skip the `setViewport(...)` update while frozen, so `tooltipStyle` math keeps using the pre-keyboard viewport height.
   - The `scroll` rAF schedule: skip while frozen.
   - The `ResizeObserver` callback on the target element: skip while frozen.
4. When unfreezing (blur / keyboard closes), trigger a single `readRect()` + `setViewport({ w: window.innerWidth, h: window.innerHeight })` to re-sync to the real layout.
5. Keep the existing `transition: 'none'` on spotlight visuals so when freeze releases there is still no perceptible drift.
6. Leave the gating logic for the Next button (`buyInFilled`) untouched. The freeze is purely positional.

## Why this works

- Frozen rect → SVG spotlight, gold stroke, and dim bands all keep their last-good geometry while the keyboard is up.
- Frozen viewport → tooltip's `top/left/width` math uses the pre-keyboard values, so the card stays exactly where it was when the user tapped Buy-in.
- The vertical `TOOLTIP_GAP` between the spotlight and the tooltip is therefore preserved 1:1.
- Because we still let the user type, scroll-block and click-block layers continue to behave as before — only the measurement loop is paused.

## Out of scope

- No changes to step content, navigation, or `tourSteps.ts`.
- No changes to `SessionForm.tsx` or any business logic. Pure presentation/positioning fix.
