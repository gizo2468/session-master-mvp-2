## Goal

For every tour step, automatically scroll the target element to the **vertical center** of the viewport before showing the spotlight, while keeping manual scroll locked. Tooltip continues to render below by default and flips above only for bottom-pinned targets that can't be centered (e.g. fixed bottom action bars).

## Problem

Right now `OnboardingTour.tsx` applies a strict scroll lock the moment it mounts (`html`, `body`, and `[data-app-scroll-root]` all get `overflow:hidden`). That lock prevents *any* scrolling — including programmatic — so steps whose target sits below the fold (e.g. `Optional Details`, `submit-session`) render with the tooltip clipped or off-screen. The user can't scroll, and the tour doesn't scroll for them.

The tooltip flip logic ("below-first, flip above only when no room") is already correct and stays.

## Changes (single file: `src/components/onboarding/OnboardingTour.tsx`)

### 1. Add a programmatic scroll helper that bypasses the lock

Helper that temporarily restores `overflow` on the app scroll root (and `html`/`body`), calls `el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })`, waits for two `requestAnimationFrame` ticks for layout to settle, then re-applies the lock.

```ts
const scrollTargetIntoCenter = (el: HTMLElement) => {
  const html = document.documentElement;
  const body = document.body;
  const appRoot = document.querySelector('[data-app-scroll-root="true"]') as HTMLElement | null;

  // Temporarily release overflow on whichever element is the real scroller.
  const released: Array<{ el: HTMLElement; prev: string }> = [];
  [html, body, appRoot].forEach((node) => {
    if (!node) return;
    released.push({ el: node, prev: node.style.overflow });
    node.style.overflow = '';
  });

  // Center the target. block:'center' guarantees vertical centering when possible.
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });

  // Re-lock on the next frame so layout has committed.
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      released.forEach(({ el, prev }) => {
        el.style.overflow = prev || 'hidden';
      });
      requestAnimationFrame(() => resolve());
    });
  });
};
```

### 2. Call the helper inside the step-change effect (`focusAndMeasure`)

In the existing `useLayoutEffect` that runs `step?.prepare?.()` then polls for the target, after the element is found and *before* `readRect()`, await `scrollTargetIntoCenter(el)`. Then read the rect and reveal the tooltip with the existing two-rAF settle.

```ts
const focusAndMeasure = async () => {
  if (cancelled || !step) return;
  const el = document.querySelector(step.selector) as HTMLElement | null;
  if (!el) {
    if (attempts >= 25) { if (!isLast) setStep(currentStep + 1); return; }
    attempts++;
    measureTimer.current = window.setTimeout(focusAndMeasure, 100);
    return;
  }
  await scrollTargetIntoCenter(el);
  if (cancelled) return;
  readRect();
  requestAnimationFrame(() => {
    if (cancelled) return;
    readRect();
    requestAnimationFrame(() => !cancelled && setTooltipVisible(true));
  });
};
```

### 3. Keep the strict lock effect as-is

The `useEffect` at lines 194–246 (locks `html`, `body`, `appRoot` and blocks `wheel`/`touchmove`/scroll keys) stays unchanged. The helper above only releases `overflow` momentarily for the programmatic `scrollIntoView` call — wheel/touchmove/keys remain blocked the entire time, so the user still cannot scroll manually.

To make sure the wheel/touch blockers don't suppress our programmatic scroll: `scrollIntoView` is a direct DOM API call, not a wheel/touch event, so the existing `preventDefault` on those listeners doesn't interfere.

### 4. Tooltip placement: no change

Existing logic (lines 418–441) already implements:
- below-by-default (`placeBelow = spaceBelow >= required || spaceBelow >= spaceAbove`)
- flip above only when bottom has no room
- horizontal centering with viewport clamp
- `90vw` max-width

After auto-centering, mid-viewport targets naturally satisfy `spaceBelow >= required` → tooltip below. Bottom-pinned targets like `[data-tour="live-controls"]` (fixed action bar) cannot be centered by `scrollIntoView` because they're position:fixed at the bottom — for those, `spaceBelow` stays tiny and the existing flip-above branch kicks in. No code change needed here.

### 5. Edge case: `position: fixed` targets

`scrollIntoView` is a no-op on fixed elements relative to viewport, which is the desired behavior — they're already visible. The flip-above branch handles tooltip placement for them automatically.

## Out of Scope

- Tooltip flip logic (already correct).
- Scroll lock structure (unchanged; only momentary overflow release for programmatic scroll).
- `tourSteps.ts`, `AppLayout.tsx`: no changes.
- Smooth scroll animation: explicitly using `behavior: 'auto'` (instant) to match the "snap, no drift" rule from the previous stabilization pass.

## Acceptance

- Each of the 11 steps auto-scrolls its target to the vertical center before the spotlight appears.
- The user cannot scroll manually at any time (wheel, touch, keyboard all still blocked).
- Mid-viewport targets show the tooltip **below** with a clean ~16px gap.
- Bottom-pinned targets (`live-controls`, `submit-session` when keyboard collapses layout) flip the tooltip **above**.
- No visible drift — the spotlight snaps to its final position without sliding.
