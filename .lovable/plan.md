## 1. Update tooltip text

**`src/components/onboarding/tourSteps.ts`** — Replace the `body` of the `[data-tour="stakes"]` step with:

> "Buy-in is the only required field to start a session. All other settings are optional. If it is a freeroll, you can simply enter 0. Enter your buy-in to continue or adjust the blinds for better accuracy."

Also update the `buyInFilled` gate in `OnboardingTour.tsx` so the Next button enables when the input has any non-empty numeric value (including `0`), not only `> 0`. Freerolls must be allowed to proceed.

## 2. Lock spotlight + tooltip on focus (true freeze)

The current freeze flag mostly works, but the spotlight still shifts upward on tap because:
- `focusin` fires AFTER iOS has already started its auto-scroll-to-input adjustment, so one rect read sneaks in.
- The freeze is keyed off `[data-tour="stakes"]`'s `focusin`, but the focus event from the Buy-in input bubbles through React's event system in a way that can race with the rAF scroll tick.
- On `focusout` we immediately re-run `readRect()` + `setViewport()`, which re-measures while the keyboard is still collapsing — causing a second visible jump.

**`src/components/onboarding/OnboardingTour.tsx`** changes:

1. **Pre-emptive freeze**: attach `pointerdown` / `touchstart` / `mousedown` listeners (capture phase) on the highlighted element. If the event target is an editable field, set `frozenRef.current = true` immediately — before iOS can begin auto-scroll. This closes the race that lets one stale rect read through.

2. **Listen on document**, not only the highlighted element: focus events can target nested inputs whose bubbling path goes through portals (e.g. Currency Select). Use `document.addEventListener('focusin' / 'focusout', ..., true)` and check `el.contains(target)` so we always catch the editable inside the stakes block.

3. **Cache last-good rect & viewport** in refs (`frozenRectRef`, `frozenViewportRef`). While frozen, the spotlight SVG and tooltip math read from these refs instead of from live state, even if a stray re-render slips through.

4. **Delay unfreeze**: on `focusout` / keyboard-close, do NOT immediately re-measure. Wait ~250ms (long enough for iOS keyboard collapse + scroll settle), then call `setViewport()` + `readRect()` once. This eliminates the second jump on blur.

5. **Keep CSS `transition: 'none'`** on spotlight visuals (already in place) so position changes never animate.

6. **No business-logic changes** — only positioning + tooltip text + the `0` gate adjustment.

## Order of execution

Text update first (step 1), then the focus-stability work (step 2). Both land in the two files above; no other files touched.

## Out of scope

- No changes to `SessionForm.tsx`, scroll-lock infrastructure, or other tour steps.
- No design system / token changes.
