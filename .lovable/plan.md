## Fix: "Finishing Up" tutorial step (live-controls)

### Problems

1. **Done button shouldn't be there.** "Finishing Up" is the last step in `TOUR_PATHS['start-session']`, so `isLast` is true and the right-side button renders as **Done** (calls `onClose`). User wants no Done button on this step at all — the tour ends naturally when the player taps the real **End Session** button (which navigates away).

2. **Previous freezes / closes the tour.** Current `handlePrev` jumps from `live-controls` to the `table-actions` step. But by the time the user reaches "Finishing Up", the table has already been ended — so `[data-tour="table-actions"]` no longer exists in the DOM. The retry loop in `useLayoutEffect` (lines 228–252) burns through `maxAttempts`, then auto-skips backwards through more missing modal-only steps (`end-table-confirm`, `end-table-notes`, `end-table-profit`, `end-table-cashout-input`), eventually running off the start and calling `onReturnToMenu` / closing the tour. That's the "freeze then close" the user sees.

### Fix (scoped to `OnboardingTour.tsx` only)

1. **Hide the Done button on `live-controls`**
   - Add `step?.selector === '[data-tour="live-controls"]'` to the `hideNextButton` condition (currently line 122). This makes the step show only **Previous** + the progress dots, no right-side action button. The tour terminates when the user taps End Session (which unmounts the live session route).

2. **Make Previous from `live-controls` land on a step that actually exists**
   - Replace the current "jump to table-actions" shortcut for this step with a dynamic lookup: walk the `steps` array backwards from `currentStep - 1` and pick the first step whose `selector` resolves to a visible element via the existing `getVisibleElement` helper.
   - In practice this will land on `live-session-details` / `live-actions` / `live-overview` (whichever is visible) instead of the missing `end-table-confirm` or the missing `table-actions`.
   - Set `directionRef.current = -1` and `setStep(targetIdx)` exactly once — no retry loop, no auto-skip cascade.
   - Fallback: if nothing resolves, stay on the current step (do not close the tour).

3. **Leave the existing `end-table-cashout-input` Previous special-case alone** — that one already works and is not part of this request.

### Out of scope

- No changes to `tourSteps.ts`.
- No changes to Next handler, design, positioning, dots, or any other step.
- No changes to `EndTableDialog`, `useOnboardingTour`, or the modal-portal layering.

### Files

- `src/components/onboarding/OnboardingTour.tsx` (only file edited)

### Expected result

- The "Finishing Up" tooltip shows **Previous** on the left and **no Done button** on the right.
- Tapping Previous moves back to the nearest still-visible live-session step (typically `live-session-details`) without freezing, skipping, or closing the tour.
- Tour continues normally; tapping the real End Session button ends the session and the tour as before.
