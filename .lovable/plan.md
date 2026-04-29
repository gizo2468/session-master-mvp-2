# Onboarding Spotlight Stability + Auto-Expand Fix

Focused fix on positioning math and pre-step DOM preparation. **No text/label changes.**

## Part 1 — Tooltip Positioning Stability (`OnboardingTour.tsx`)

Current bugs:
- `measure()` uses a fixed `180` height assumption for above/below decisions — wrong for taller tooltips, causing the tooltip to overlap the spotlight (image_0 case).
- On scroll, `measure()` is debounced via the same `setTimeout` retry path; if the element is near a viewport edge it triggers a `scrollIntoView` which fights the user's scroll → jitter.
- Horizontal centering is correct, but vertical "prefer below / fall back to above" never accounts for actual tooltip height, so the gap is inconsistent.

Changes:
1. **Measure the tooltip itself**: add a `tooltipRef` and read its real `offsetHeight` after first paint via `useLayoutEffect`. Store as `tooltipHeight` state.
2. **Recompute placement using real height**:
   - `spaceBelow = viewport.h - (spotlight.y + spotlight.h)`
   - `spaceAbove = spotlight.y`
   - Place below if `spaceBelow >= tooltipHeight + TOOLTIP_GAP + 16`, else above if `spaceAbove >= tooltipHeight + TOOLTIP_GAP + 16`, else clamp to viewport with `TOOLTIP_GAP` away from spotlight (never overlapping).
   - Always center horizontally on `spotlight.x + spotlight.w/2`, then clamp to viewport edges.
3. **Stop fighting the user on scroll**:
   - Remove the auto `scrollIntoView` from `measure()`. Keep `scrollIntoView` only inside the step-change effect (initial focus on a new step).
   - Replace per-event `measure()` on `scroll`/`resize` with a `requestAnimationFrame`-throttled measurer so the spotlight rect updates in lockstep with the page (no debounce lag).
   - Keep listeners with `capture: true` so nested scrollers also trigger updates.
4. **Initial-focus scroll** (step change only): if element is outside viewport, `scrollIntoView({block: 'center'})`, then start the rAF loop until the rect stabilizes (two consecutive equal rects), then reveal the tooltip with `setTooltipVisible(true)`. This kills the visible "jump" when a step opens.
5. Apply a CSS `transition: top/left 200ms ease-out` only when the spotlight already exists (skip transition on first appearance) to keep scroll-tracking crisp without animation lag.

## Part 2 — State-Aware Steps (auto-expand before spotlight)

Goal: a step targeting an element inside a collapsed section must open the section first, then spotlight the actual control — no floating box over a closed accordion.

### Step config extension (`tourSteps.ts`)

Add an optional pre-step hook:

```ts
export interface TourStep {
  // ...existing fields
  /** Run before measuring; use to open accordions, switch tabs, etc. Return when DOM is ready. */
  prepare?: () => void | Promise<void>;
}
```

### New "Advanced Options" steps

Add three sub-steps in the `start-session` path, inserted **after** `optional-details` and **before** `submit-session`:

1. `selector: '[data-tour="advanced-online"]'` — Online Game checkbox row
2. `selector: '[data-tour="advanced-multiday"]'` — Multi-Day Tournament row (only when format = Tournament; otherwise skipped at runtime)
3. `selector: '[data-tour="advanced-late-reg"]'` — Late Registration row (same condition)

Each carries:
```ts
prepare: () => {
  window.dispatchEvent(new CustomEvent('onboarding:open-advanced'));
  // wait for collapsible animation
  return new Promise(r => setTimeout(r, 250));
}
```

### `SessionForm.tsx` changes

- Add `data-tour` attributes to the three `FormItem`s above (Online Game, Multi-Day, Late Registration).
- Add an effect that listens for `onboarding:open-advanced` and calls `setIsAdvancedOpen(true)`.
- Skip-step logic: if the step's selector resolves to no element after `prepare()` (e.g. Multi-Day when format is Cash), `OnboardingTour` auto-advances to the next step. Implemented in the existing measure-retry loop: after N failed attempts, call `setStep(currentStep + 1)` instead of leaving the tooltip stranded.

### `OnboardingTour.tsx` integration

In the step-change `useLayoutEffect`:
```ts
async function run() {
  setTooltipVisible(false);
  await step.prepare?.();
  // existing tryMeasure() retry, then reveal
}
```

## Technical Notes

- `tooltipHeight` defaults to a safe `200` until first measured to avoid a placement flicker.
- Use `getBoundingClientRect` + rAF (no `setInterval`) for scroll tracking — cheap and tear-free.
- Collapsible currently uses Radix `data-[state=open]/closed` animations (~200ms) — the 250ms `prepare` delay covers it.
- No changes to existing copy, button labels, menu structure, or the `home-guide` / `dashboard-guide` paths.

## Files Touched

- `src/components/onboarding/OnboardingTour.tsx` — placement math, scroll tracking, prepare hook, auto-skip on missing element.
- `src/components/onboarding/tourSteps.ts` — `prepare` field; three new advanced-options steps.
- `src/pages/SessionForm.tsx` — `data-tour` attributes on three rows; listener for `onboarding:open-advanced`.
