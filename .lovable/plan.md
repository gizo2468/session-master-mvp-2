# Add Tap Hand to Step 5 (Start Session)

## What changes

On Step 5 ("You're All Set!" — Start Session button), add the same pulsing tap-hand animation already used on Steps 2 and 4. This visually indicates that the golden Start Session button is the only way to advance.

Already in place (no changes needed):
- Next/Done button is hidden on this step.
- Skip and Previous remain in the footer.
- Spotlight is interactive — the real Start Session button is clickable.
- On submit, `SessionForm.onSubmit` advances the tour to Step 6 on the Live Session dashboard.

## Implementation

### `src/components/onboarding/OnboardingTour.tsx`
- Extend `showTapHand` to also include `isSubmitSessionStep`, so the existing pulsing `Hand` icon overlay renders centered on the Start Session button's bounding rect.
- The submit-session spotlight already targets the button itself (not a wrapping container), so the default `rect.left + rect.width/2` / `rect.top + rect.height/2` centering will land directly on the button — no special anchor lookup needed (unlike the stakes step which targets a wrapper with multiple inputs).

That's the only change.
