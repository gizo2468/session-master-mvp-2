## Root cause

The "Session Summary" target lives inside a Radix Sheet that slides up from the bottom on mobile via a ~500ms CSS animation. `getBoundingClientRect()` returns coordinates **after** the current transform, so any measurement taken mid-animation reports the target's transformed (lower / off) position. Once the animation finishes the rect is correct, but by then the spotlight has already been positioned and is not re-measured.

Currently `OnboardingTour.tsx` handles modal steps with:
- a single `setTimeout(readRect, 220)` after the step opens, and
- an `animationend` / `transitionend` listener on the closest `[role="dialog"]`.

Both are insufficient on mobile because:
1. 220 ms is shorter than the Sheet's enter animation (~500 ms with shadcn defaults).
2. `animationend` bubbles up from inner children (overlay, inner divs) and fires **before** the SheetContent's own slide animation completes, so the early event triggers a measurement on a still-transformed target. After that, no further re-measure happens until the user resizes the viewport — which is exactly the bug.

A viewport switch works around it because the resize listener calls `readRect()` after the sheet is fully settled.

## Fix

Update `src/components/onboarding/OnboardingTour.tsx` only — no other files.

1. **Multi-checkpoint re-measure for modal steps.** Replace the single 220 ms timeout with a small schedule of re-measurements at roughly 120 / 300 / 550 / 850 ms after the step activates. Cancel all of them on unmount/step change. This guarantees we capture the final rect after the Sheet's slide-in animation has fully completed, regardless of exact duration.

2. **Filter `animationend` to the dialog element itself.** Change the existing `animationend` handler on the closest `[role="dialog"]` to ignore bubbled events from descendants (only react when `event.target === dialog`). This prevents the early false-settle measurement from inner overlay/content animations.

3. **Observe the dialog's size, not just the target's.** Extend the existing `ResizeObserver` block so that for modal steps it also observes the closest `[role="dialog"]` ancestor. The sheet's height/transform changes during the enter animation will trigger continuous re-measures, keeping the spotlight glued to the final pill position as soon as it stops moving.

No changes to tooltip layout, step content, `EndSessionSheet.tsx`, or `tourSteps.ts`.

## Validation

- Open End Session sheet at mobile viewport with the tour active on the Session Summary step → spotlight should sit centered on the "$ Session Summary" pill from the first frame after the sheet finishes sliding up, with no need to toggle viewport.
- Desktop and tablet behavior unchanged (the extra re-measures are idempotent).
- Other modal-step highlights (end-table-intro, cashout-input, etc.) benefit from the same robustness without behavior changes.
