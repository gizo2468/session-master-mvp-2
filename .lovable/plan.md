## Fix Step 2: Tight Spotlight on START SESSION + Pulse Animation

### Root cause
On the Home page, `data-tour="start-session"` is attached to the **outer wrapper** that contains the big chip image, three satellite icon chips (Player Card / Coach / Notes), and the gold radial glow. The spotlight measures that wrapper's bounding box, so it dims everything *around* a huge area but nothing reads as "highlighted" — the tooltip ends up floating over the wrapper's center with no visible focus.

### Fix overview
1. Move the `data-tour="start-session"` target to the **inner circular hit-area button** inside `NewSessionButton.tsx`. That element is centered on the chip image and sized to 55% of its width with `aspect-square rounded-full` — it's the exact shape and footprint of the green "START SESSION" poker chip.
2. Add a continuous pulse/press animation to that same chip element while the tour is highlighting it.
3. The OnboardingTour already uses a rounded spotlight rectangle around the target's bounding rect — once the target is the tight circular button, the cutout lands precisely on the chip and the satellite icons stay dimmed.

### Changes

**`src/components/NewSessionButton.tsx`**
- Add `data-tour="start-session"` to the inner `<button>` (the circular hit area), and remove the attribute from the outer wrapper in `Index.tsx`.
- Add a class like `tour-pulse-target` to that button so we can drive the pulse via CSS only when the tour is active.

**`src/pages/Index.tsx`**
- Remove `data-tour="start-session"` from the outer `<div className="relative flex justify-center -mt-36 mb-0">` wrapper (keep all other classes and children unchanged).

**`src/components/onboarding/OnboardingTour.tsx`**
- When Step 2 is active (i.e., the resolved DOM element matches `[data-tour="start-session"]`), toggle a body-level class such as `onboarding-pulse-active`. Remove it on step change / unmount.
- This lets us scope the pulse animation to "tour is on this step" without coupling the button to tour state via React props.

**`src/index.css`**
- Add a keyframe + utility:

```css
@keyframes tour-press-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 0 hsl(var(--primary) / 0.55); }
  50%      { transform: translate(-50%, -50%) scale(1.06); box-shadow: 0 0 0 14px hsl(var(--primary) / 0); }
}

body.onboarding-pulse-active .tour-pulse-target {
  animation: tour-press-pulse 1.4s ease-in-out infinite;
  border-radius: 9999px;
}
```

The existing button uses `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2` for centering, so the keyframe preserves that translate while applying scale. The expanding shadow ring reads as a "tap ripple" around the chip.

### Result
- Step 1: spotlight on the Session Master logo (unchanged).
- Step 2: spotlight is a tight circular cutout exactly around the green "START SESSION" chip; the chip pulses + emits a soft gold ripple until the user taps Next. Surrounding satellite chips (Player Card, Coach, Notes) are fully dimmed.
- Steps 3 & 4: unchanged.
- Reset Onboarding from Settings still replays the full sequence (no change to the hook or wiring).

### Files
- `src/components/NewSessionButton.tsx` (move data-tour attr + add pulse class)
- `src/pages/Index.tsx` (remove data-tour attr from outer wrapper)
- `src/components/onboarding/OnboardingTour.tsx` (toggle body class on step 2)
- `src/index.css` (pulse keyframe + scoped utility)
