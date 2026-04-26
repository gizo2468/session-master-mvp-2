## Step 2 (Start a Session) — focused action UI

Two scoped changes apply ONLY to the "Start a Session" step (selector `[data-tour="start-session"]`). All other tour steps remain unchanged.

### 1. Remove the Next button (Step 2 only)

In `src/components/onboarding/OnboardingTour.tsx`, conditionally hide the right-side "Next" button when the current step targets the START SESSION chip. Skip (left) and Previous (right) stay in their current positions, so the footer layout — buttons row + centered indicator dots — is preserved.

```tsx
const isStartSessionStep = step?.selector === '[data-tour="start-session"]';
// ...
<div className="flex items-center gap-2">
  {!isFirst && (
    <Button variant="outline" size="sm" onClick={handlePrev}>Previous</Button>
  )}
  {!isStartSessionStep && (
    <Button size="sm" onClick={handleNext}>{isLast ? 'Done' : 'Next'}</Button>
  )}
</div>
```

The tour already auto-advances to Step 3 the moment the chip is clicked (existing click listener at lines 133–144), so removing Next does not block progression — the user must tap the spotlighted chip to continue.

### 2. Pulsing tap-hand overlay on the chip

Render a finger/hand icon centered on the START SESSION chip while Step 2 is active, with a continuous press animation. The overlay is purely visual (`pointer-events-none`) so the chip underneath stays clickable through the spotlight cutout.

```text
       ┌──────────────────┐
       │   START SESSION  │
       │       👆 ←pulse  │  ← Hand icon, perfectly centered on chip
       │     (chip face)  │
       └──────────────────┘
```

**Positioning**: Compute the chip's center from the existing `rect` (already measured by the tour), then absolutely position the overlay at that point inside the tour's fixed container. This guarantees the icon stays locked on the visible green chip even as the layout shifts.

```tsx
{isStartSessionStep && rect && (
  <div
    className="absolute pointer-events-none tour-tap-hand"
    style={{
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2,
      transform: 'translate(-50%, -50%)',
      zIndex: 2,
    }}
    aria-hidden="true"
  >
    <Hand className="w-12 h-12 text-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
  </div>
)}
```

Use `lucide-react`'s `Hand` icon (already a project dependency) in the gold `--primary` color with a soft drop-shadow so it reads against both the cream and green portions of the chip.

**Animation**: Add a dedicated keyframe in `src/index.css` that simulates a finger press — a gentle scale-down + slight downward nudge, looped smoothly. This is independent from the existing chip ripple (`tour-press-pulse`), which keeps pulsing the chip itself.

```css
@keyframes tour-tap-press {
  0%, 100% { transform: translate(-50%, -50%) scale(1) translateY(0); opacity: 0.95; }
  45%      { transform: translate(-50%, -50%) scale(0.82) translateY(3px); opacity: 1; }
  60%      { transform: translate(-50%, -50%) scale(0.82) translateY(3px); opacity: 1; }
}
.tour-tap-hand {
  animation: tour-tap-press 1.4s ease-in-out infinite;
  will-change: transform, opacity;
}
```

The 1.4s cycle matches the existing chip ripple (`tour-press-pulse`) so the two animations stay in visual sync — the hand "presses down" exactly as the gold ripple expands.

### Files touched

- `src/components/onboarding/OnboardingTour.tsx` — conditional Next button + hand overlay JSX, import `Hand` from `lucide-react`.
- `src/index.css` — add `@keyframes tour-tap-press` and `.tour-tap-hand` rule.

No changes needed to `tourSteps.ts`, `useOnboardingTour.ts`, or any page component.
