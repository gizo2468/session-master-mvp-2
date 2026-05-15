## Goal
Make the onboarding tutorial a one-shot, first-flow-only experience. The moment the user leaves the live session screen (back to home, app close, etc.), the tutorial is permanently marked completed. Resuming a session never re-triggers tour overlays.

## Root cause
`useOnboardingTour` persists `onboarding_tour_step` and `onboarding_tour_path` in `localStorage` and only clears them when the user explicitly hits "Done"/dismiss inside the tour (`dismiss()`). Nothing clears them when the user navigates away from `/session/:id`. On Resume, `LiveSession` mounts, reads the persisted `tourPath = 'start-session'` + saved step, computes `isLiveTourStep = true`, and renders `<OnboardingTour />` again.

## Changes (frontend only)

### 1. `src/pages/LiveSession.tsx`
Add a single unmount effect that, if the start-session tour is active (`tourPath === 'start-session'` and not yet completed), calls `dismissOnboardingTour()` when the component unmounts. This covers:
- navigating to home / any other route
- iOS swipe-back
- app close (state already persisted as completed before next mount)

```text
useEffect(() => {
  return () => {
    if (tourPath === 'start-session' && showOnboardingTour) {
      dismissOnboardingTour();
    }
  };
}, [tourPath, showOnboardingTour, dismissOnboardingTour]);
```

### 2. `src/hooks/useActiveSessionRecovery.ts` (defensive)
Before `navigate(/session/:id)` inside `resumeSession`, proactively mark the tour completed so the resumed screen never flashes a tooltip even if the unmount-cleanup above didn't run (e.g. hard refresh while on home with stale storage). Use the existing dismiss pattern by writing the same `localStorage` flags directly, or import `triggerOnboardingReset`'s sibling — simplest: inline-set `onboarding_tour_completed=true` and remove `onboarding_tour_step` / `onboarding_tour_path`, then dispatch the `onboarding-tour:step-changed` event so subscribers refresh.

### 3. No changes to tour logic itself
We are not changing `OnboardingTour.tsx` or `tourSteps.ts`. The tour still works on the very first run; it just can no longer resurrect itself after the user leaves `/session/:id`.

## Out of scope
- The earlier End Table tour deadlock (separate bug).
- The Resume FK fix already shipped in `useSessionLoader.ts`.

## Verification
1. Fresh account → start tour → reach Live Session → tap home → return: Resume opens session with no tooltips.
2. Start tour → reach Live Session → kill app → reopen → Resume: no tooltips.
3. First-ever live session flow still shows the tour normally up until the user leaves the screen.