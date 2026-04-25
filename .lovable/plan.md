## Problem

The "Reset Onboarding" button in Settings does not work because it only clears a legacy localStorage key (`onboarding_start_session_seen`) that the new multi-step tour no longer uses.

The current onboarding tour reads from two new keys:
- `onboarding_tour_completed`
- `onboarding_tour_step`

Since neither is cleared on Reset, the tour stays "completed" and never replays.

A correct helper already exists in `src/hooks/useOnboardingTour.ts`:

```ts
export function triggerOnboardingReset() {
  localStorage.removeItem('onboarding_tour_completed');
  localStorage.removeItem('onboarding_start_session_seen');
  localStorage.setItem('onboarding_tour_step', '0');
  window.dispatchEvent(new Event('onboarding-tour:reset'));
}
```

Both Reset buttons should use this helper instead of inlining (incorrect) logic.

## Changes

### 1. `src/pages/Settings.tsx`
Replace the inline `onClick` handler of the Reset Onboarding button to call `triggerOnboardingReset()` from `@/hooks/useOnboardingTour`. Keep the toast feedback.

### 2. `src/components/settings/AppSettings.tsx`
Same fix: import `triggerOnboardingReset` and call it from the button's `onClick`. Keep the toast feedback.

### 3. (Optional safety) Confirm `useOnboardingTour` listener
The hook already listens for the `onboarding-tour:reset` event and resets state to `{ completed: false, step: 0 }`, then dispatches `onboarding-tour:step-changed`. No changes needed there — this confirms that pressing Reset will cause the tour to immediately re-render on the Home page (or next time the user navigates to it).

## Result

Pressing "Reset" will:
1. Clear `onboarding_tour_completed` and reset `onboarding_tour_step` to `0`.
2. Also clear the legacy key for safety.
3. Fire `onboarding-tour:reset`, causing the `useOnboardingTour` hook to update state across the app immediately.
4. Show the toast confirmation.
5. The full guided tour (Welcome → Start a Session → Game Setup → Stakes → Final Action) replays the next time the user is on Home.
