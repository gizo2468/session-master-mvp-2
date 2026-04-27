## Goal

Keep the onboarding tour alive after "Start Session" is pressed, and continue it on the Live Session page with three new spotlight steps (Track Your Edge → Stay Active → Finishing Up).

## Changes

### 1. Don't dismiss the tour on session start
`src/pages/SessionForm.tsx` (around line 260) currently calls `dismissOnboardingTour()` right before navigating to `/session/:id`. Remove that dismiss call and instead **advance** the tour to the next step (Step 6 — "Track Your Edge"). The tour will then automatically render on the Live Session page once it mounts.

### 2. Add three new tour steps
`src/components/onboarding/tourSteps.ts`:
- Add a new route literal `'/session'` to the `TourStep['route']` union.
- Append three steps after the existing "You're All Set!" step:

| # | Selector | Title | Body |
|---|----------|-------|------|
| 6 | `[data-tour="live-scoreboard"]` | Track Your Edge | This is your live scoreboard. Watch your profit or loss update in real-time as you log your hands and actions. |
| 7 | `[data-tour="live-actions"]` | Stay Active | Use these buttons to log every important moment. Whether it's a big pot or a strategic note, keep your data fresh! |
| 8 | `[data-tour="live-controls"]` | Finishing Up | When you're done for the day, click here to wrap up. We'll save all your stats and add them to your overall record. |

All three are `interactive: true` so the user can scroll/explore the page underneath the spotlight, and they all live on the `/session` route.

### 3. Tag the Live Session UI with tour selectors
`src/components/poker/SessionTimerCard.tsx`:
- Wrap the gold Session Timer block (the digital clock + Started/Total Tables/Hands Saved grid) in a container with `data-tour="live-scoreboard"`. This is the most prominent "live scoreboard" element at the top of the page in the current design (note: there is no separate P&L/bankroll card at the top — the running P&L lives inside the Session Details card lower down. The Session Timer is what visually anchors the top of the page, so we'll spotlight that as the live scoreboard).
- Add `data-tour="live-actions"` to the row containing **Add Table** + **BB/Stack Update** + **Upload Hand** (the action buttons used to log activity during a session).
- Add `data-tour="live-controls"` to the **End Session** button (the wrap-up control).

To keep the markup clean, we'll wrap the existing `Add Table` / `End Session` row split: the `End Session` button gets its own wrapper with `data-tour="live-controls"`, and a new wrapper around the `BB/Stack Update` + `Upload Hand` stack (plus `Add Table`) gets `data-tour="live-actions"`.

### 4. Render the tour on the Live Session page
`src/pages/LiveSession.tsx`:
- Import `OnboardingTour`, `TOUR_STEPS`, and `useOnboardingTour`.
- Mirror the pattern used in `Index.tsx` / `SessionForm.tsx`: compute `isLiveTourStep = TOUR_STEPS[tourStep]?.route === '/session'` and render `<OnboardingTour …/>` only when `showOnboardingTour && isLiveTourStep`.
- `onClose={dismissOnboardingTour}` so Skip/Done finishes the tour cleanly.

### 5. Final-step copy
The existing tooltip already shows "Done" on the last step. With three new steps appended, Step 8 ("Finishing Up") will naturally be the last and show **Done** as the confirm button — matching the requested "Finish Tour" behavior.

## Files Edited

- `src/components/onboarding/tourSteps.ts` — add `/session` route, append 3 new steps.
- `src/pages/SessionForm.tsx` — replace `dismissOnboardingTour()` with `setTourStep(currentStep + 1)` (advance instead of dismiss) before navigating to the live session.
- `src/components/poker/SessionTimerCard.tsx` — add three `data-tour` selectors to the relevant DOM regions.
- `src/pages/LiveSession.tsx` — render `<OnboardingTour>` for `/session` route steps.

## Notes / Assumption

The brief mentions a "P&L / Bankroll display at the top" but the current Live Session page has no dedicated bankroll widget at the top — the Session Timer is the prominent top element, and Profit/Loss appears inside the Session Details card below. We're spotlighting the **Session Timer card** for Step 6 ("Track Your Edge") as the closest match to the described "live scoreboard at the top". If you'd prefer to spotlight the Profit/Loss row inside Session Details instead (further down the page), let us know and we'll re-target that selector.
