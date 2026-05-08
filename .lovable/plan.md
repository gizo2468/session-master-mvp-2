## Goal
Gate the tour's "Set the Stakes" step so the user must enter a Buy-in amount before progressing, and update the tooltip copy to reflect that Buy-in is the only required field.

## Changes

### 1. `src/components/onboarding/tourSteps.ts`
Update the body of the `[data-tour="stakes"]` step to:
> "Buy-in is the only field you need to start a session — everything else is optional. Enter your starting buy-in to continue, or adjust the blinds if you want more accurate stats."

(Title stays "Set the Stakes".)

### 2. `src/components/onboarding/OnboardingTour.tsx`
Add a Buy-in gating mechanism active only when `isStakesStep` is true:

- Add state `buyInFilled: boolean`.
- In an effect keyed on `isStakesStep` + `rect`: locate the buy-in input inside the spotlighted block (`document.querySelector('[data-tour="stakes"] input[inputmode="decimal"]')`, falling back to the first `input` inside the `[data-tour="stakes"]` container). Read its current value, set `buyInFilled` to `parseFloat(value) > 0`. Attach an `input` listener that re-evaluates on every keystroke. Clean up on unmount/step change.
- In the tooltip footer, when `isStakesStep && !buyInFilled`:
  - `disabled` the Next button.
  - Add `aria-disabled` and a muted style so it is visually clear it's inactive.
  - Optionally add a small helper line above the buttons: "Enter a Buy-in amount to continue." (only shown on this step while disabled).
- When the user types a value, the listener flips `buyInFilled` to true and Next becomes enabled immediately. No other step is affected.

### 3. No changes to `SessionForm.tsx`
The buy-in input already lives inside `[data-tour="stakes"]`, so we read its value directly via DOM. This keeps the gate purely a tutorial-layer concern and avoids coupling form state to the tour.

## Technical notes
- DOM-level reading (rather than lifting form state) keeps the change isolated to the tour component and matches the existing pattern (the tour already queries the DOM for spotlight measurement).
- Listener uses `input` event (covers typing, paste, programmatic change via React because React dispatches `input`).
- Gate only applies to the stakes step; all other steps behave exactly as today.
- Previous button remains enabled on the stakes step.

## Files touched
- `src/components/onboarding/tourSteps.ts`
- `src/components/onboarding/OnboardingTour.tsx`
