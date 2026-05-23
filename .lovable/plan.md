## Make the "Finishing Up" step interactive

Turn the final `live-controls` step into a tap-to-advance step (mirroring how `start-session`, `submit-session`, and `table-actions` already work), and add one closing step inside the End Session sheet.

### 1. `src/components/poker/EndSessionSheet.tsx`
- Add `data-tour="end-session-confirm"` to the red **End Session** button at line ~239–245 so the new tour step has something to anchor on.

### 2. `src/components/onboarding/tourSteps.ts`
- Append one new step to the end of `TOUR_PATHS['start-session']`, right after `live-controls`:
  - `selector: '[data-tour="end-session-confirm"]'`
  - `title: 'Save Your Session'`
  - `body: 'Review your cash-out and notes, then tap End Session to save everything to your history.'`
  - `interactive: true`, `compact: true`, `route: '/session'`, `placement: 'above'`

### 3. `src/components/onboarding/OnboardingTour.tsx`

For the `live-controls` step only:

- **Remove Previous button.** Add `isLiveControlsStep` to the `hidePreviousButton` condition on line 124. Next/Done is already hidden via `hideNextButton`, so the tooltip will show only title, body, and progress dots.
- **Add animated hand indicator.** Extend the `showTapHand` expression (line 121) with `|| isLiveControlsStep`. The existing render block at line 1163 already centers the `<Hand>` over `rect`, which for `live-controls` wraps the End Session button — no extra branch needed.
- **Require a real tap on End Session to advance.** Add a new `useEffect` next to the existing `start-session` click handler (line 694). When `isLiveControlsStep`, attach a one-shot capture-phase `click` listener on the `[data-tour="live-controls"]` element that calls `setStep(currentStep + 1)` and sets `directionRef.current = 1`. The button's own `onClick` continues to open the End Session sheet, so the next step's selector mounts naturally and the existing retry loop picks it up.
- **No auto-advance**, no mutation observer for this step — the tour waits for the genuine click.

The new `end-session-confirm` step needs no special handler: when the user taps End Session inside the sheet, the live session route unmounts and the tour terminates as it already does today. The step shows the default **Done** button as its right-side action, matching every other terminal step.

### Out of scope
- No changes to other steps, styling, design, positioning, or the `end-table-cashout-input` Previous special-case.
- No changes to `EndSessionSheet` layout, copy, or behavior beyond adding the `data-tour` attribute.

### Files touched
- `src/components/onboarding/tourSteps.ts`
- `src/components/onboarding/OnboardingTour.tsx`
- `src/components/poker/EndSessionSheet.tsx`

### Expected result
- "Finishing Up" tooltip shows only the title, body, and progress dots — no Previous, no Done.
- An animated hand pulses over the red End Session button.
- Tapping End Session opens the sheet and advances the tour to one final step anchored on the sheet's red End Session confirm button.
- Tapping that confirm button ends the session and closes the tour normally.
