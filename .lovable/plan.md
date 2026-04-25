## Goal

After the user clicks the "START SESSION" chip on the Home screen (Step 2), the tour should persist and continue on the `/new-session` screen with 3 additional spotlight steps, all of which leave the underlying form fully interactive.

## Approach

### 1. Persist tour progress across navigation

Update `src/hooks/useOnboardingTour.ts` to track the **current step index** in `localStorage`, not just a "seen" boolean. This lets the tour resume on the next route after navigation.

- New keys:
  - `onboarding_tour_step` — current step index (number). Absent = not started OR finished.
  - `onboarding_tour_completed` — `'true'` once tour ends/skipped (replaces the existing `onboarding_start_session_seen`).
- New API exposed by the hook:
  - `currentStep: number` — read from storage, kept in React state.
  - `setStep(n: number)` — persists to storage and updates state.
  - `dismiss()` — marks completed and stops showing.
  - `shouldShow: boolean` — `true` when not completed.
- Cross-tab/route sync: listen to a `storage` event and a custom `onboarding-tour:step-changed` window event so both pages stay in sync.

### 2. Make `OnboardingTour` a controlled component

Currently `OnboardingTour` owns `currentStep` internally. Refactor it to accept `currentStep` and `onStepChange` props (with sensible defaults to remain backward compatible). Home and `SessionForm` will both render the tour but pass `currentStep` from the shared hook so progress carries across pages.

### 3. Trigger navigation + step advance from Home Step 2

The existing one-shot click handler on `[data-tour="start-session"]` currently calls `onClose()`. Change it to:
- Advance the tour to step 2 (the first SessionForm step) instead of closing.
- The chip's own `onClick` still navigates to `/new-session`.

### 4. Render the tour on `SessionForm`

In `src/pages/SessionForm.tsx`:
- Import the hook and `OnboardingTour`.
- Add `data-tour` attributes to the relevant form elements:
  - `data-tour="game-setup"` — wrapper `<div>` containing both the Game Type and Format `FormField`s.
  - `data-tour="stakes"` — wrapper `<div>` containing Buy-in Amount + the Cash-mode Blinds block (or, for tournaments, Buy-in + Starting BB).
  - `data-tour="submit-session"` — the bottom "Start Session" submit `<Button>`.
- Render `<OnboardingTour />` with the full 5-step list, controlled by the hook, only when `shouldShow` is true and `currentStep >= 2`.

### 5. Define the full 5-step tour

The step array lives in a new shared file `src/components/onboarding/tourSteps.ts` so both pages reference the same list:

1. Logo — *Welcome to Session Master* (Home)
2. Start Session chip — *Start a Session* (Home, interactive circle)
3. Game Type + Format — *Define Your Game* (SessionForm, interactive rect)
4. Buy-in + Blinds — *Set the Stakes* (SessionForm, interactive rect)
5. Start Session button — *You're All Set!* (SessionForm, interactive rect)

### 6. Make non-circle spotlight steps interactive too

Currently only the circular (Step 2) spotlight is click-through; the rectangular SVG mask blocks pointer events for all other steps. Extend the "interactive" mode to rectangular spotlights for steps 3, 4, and 5:

- Add an optional `interactive: true` flag per step (or infer it for these specific selectors).
- When `interactive` is true and `spotlight` (rect) exists, render 4 dim-band divs around the rectangle (analogous to the existing circle bands) instead of the full SVG mask. The hole over the rect lets clicks reach inputs/buttons underneath.
- The gold stroke outline (already drawn for both circle and rect) is unchanged.
- The tooltip footer (Skip / Previous / Next) remains `pointer-events: auto`, so the user controls progression. Step 5 still requires the user to click "Done" or submit the form.

### 7. Auto-finish on real submit (Step 5)

When the user actually submits the form on Step 5 (regardless of whether they clicked "Done"), call `dismiss()` so the tour doesn't reappear. Hook this into the existing `onSubmit` success path in `SessionForm.tsx`.

## Files Affected

- `src/hooks/useOnboardingTour.ts` — track current step, expose `currentStep` / `setStep`.
- `src/components/onboarding/OnboardingTour.tsx` — accept controlled `currentStep` / `onStepChange`; support interactive rectangular spotlights; advance (instead of close) on the START SESSION chip click.
- `src/components/onboarding/tourSteps.ts` — new shared 5-step definition.
- `src/pages/Index.tsx` — use shared steps; controlled tour.
- `src/pages/SessionForm.tsx` — add `data-tour` attributes; render the tour; dismiss on successful submit.

## Notes

- Storage migration: if the legacy key `onboarding_start_session_seen` is set to `'true'`, treat the tour as completed (set `onboarding_tour_completed`) so existing users aren't shown the tour again.
- The "Reset onboarding" trigger (`triggerOnboardingReset`) will clear both new keys and start at step 0.
- Tooltip positioning logic already adapts to viewport and scrolls the target into view, so the existing measurement code handles the form fields without changes.
