## Add two tour steps inside the End Session sheet

Replace the current single `end-session-confirm` step with two sequential steps that walk the user through reviewing the summary and then tapping the real End Session button.

### 1. `src/components/poker/EndSessionSheet.tsx`
- Add `data-tour="end-session-summary"` to the Session Summary card wrapper at line 142 (the `<div className="bg-gray-50 dark:bg-background rounded-lg p-4">`).
- Keep the existing `data-tour="end-session-confirm"` on the red End Session button (line 240) unchanged.

### 2. `src/components/onboarding/tourSteps.ts`
At the end of `TOUR_PATHS['start-session']`, replace the single existing `end-session-confirm` step with two steps in this order:

- **Session Summary review step**
  - `selector: '[data-tour="end-session-summary"]'`
  - `title: 'Review Your Session'`
  - `body: 'This is your final session recap — buy-in, cash-out, duration, and totals. Take a moment to make sure everything looks right before closing.'`
  - `interactive: true`, `compact: true`, `route: '/session'`, `placement: 'below'`
  - Shows the default **Next** button so the user advances normally.

- **End Session confirm step** (kept as the final step)
  - `selector: '[data-tour="end-session-confirm"]'`
  - `title: 'Save Your Session'`
  - `body: 'Tap End Session to save everything to your history and finish the tour.'`
  - `interactive: true`, `compact: true`, `route: '/session'`, `placement: 'above'`

### 3. `src/components/onboarding/OnboardingTour.tsx`
For the new final `end-session-confirm` step only (mirrors how `live-controls` was wired):

- Add an `isEndSessionConfirmStep` boolean.
- Include it in `showTapHand` (so the animated hand pulses over the red button).
- Include it in `hideNextButton` and `hidePreviousButton` (no Next, no Previous — tap-only).
- Add a `useEffect` that attaches a one-shot capture-phase `click` listener on `[data-tour="end-session-confirm"]`. On click:
  - Dismiss the tour (call the same `dismiss` path used at tour completion) so the tooltip disappears the moment the user taps.
  - The button's own `onClick` still fires and ends the session normally.
- No auto-advance, no mutation observer.

The Session Summary step needs no special handler — it shows the default Next button and progresses to the confirm step in the standard way.

### Out of scope
- No changes to the End Session sheet layout, copy, totals, or session-ending logic.
- No changes to any earlier tour step.
- No styling changes to the tooltip or hand indicator.

### Files touched
- `src/components/poker/EndSessionSheet.tsx`
- `src/components/onboarding/tourSteps.ts`
- `src/components/onboarding/OnboardingTour.tsx`

### Expected result
- After tapping the real red End Session button on the live session screen, the End Session sheet opens.
- Step 1 (inside sheet): Session Summary card is spotlighted with a short review message and a Next button.
- Step 2 (inside sheet): Red End Session button is spotlighted with an animated hand and no Next/Previous — user must physically tap it.
- Tapping the real button ends the session and the tour closes normally.
