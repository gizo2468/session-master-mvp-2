## Goal

Inside any active sub-guide (Start Session, Home, Dashboard), the bottom-left footer button should no longer end the tour. Instead, it becomes a **Previous** button that, when on the first step of that path, returns the user to the **Welcome menu** (the path-selection screen). The standalone Welcome menu keeps its existing **Skip** button (the only place to close the tour without finishing).

## Behavior

**Welcome Menu (no active path):**
- Unchanged: `Skip` (left) closes the tour entirely. Three path buttons remain.

**All sub-guides (Start Session / Home / Dashboard), first step:**
- Replace bottom-left `Skip` with `Previous`.
- Clicking `Previous` clears the active path and returns to the Welcome menu (does NOT close the tour).

**All sub-guides, subsequent steps:**
- Bottom-left becomes `Previous` (steps back through the path). This is already the case for most steps — we just unify so it appears on every step (including the ones that currently hide it, except where it would break flow on `[data-tour="game-setup"]` post-navigation, which we'll keep hidden).
- Right side: `Next` advances; on the final step shows `Done` which closes the tour.

**Home Guide & Dashboard Guide specifics:**
- These currently have a single step. The footer shows `Previous` (left, back to menu) and `Done` (right, closes tour).

**Start Session Guide specifics:**
- Step 1 (logo/chip spotlight): `Previous` left (back to menu). Right side stays as it is today (the `Next` button is hidden because the chip click itself advances).
- Final live-controls step: `Done` continues to close the tour.

## Technical Changes

**`src/hooks/useOnboardingTour.ts`**
- Add a `returnToMenu()` action that clears `activePath` (removes `PATH_KEY`), resets `step` to 0, but does NOT set `COMPLETED_KEY`. Dispatches `STEP_CHANGED_EVENT` so listeners refresh. The tour stays visible and the menu re-renders.

**`src/components/onboarding/OnboardingTour.tsx`**
- Add new prop `onReturnToMenu?: () => void`.
- In the sub-guide render block (lines ~521-539), replace the left-side `Skip` button with a `Previous` button:
  - If `isFirst` (currentStep === 0): label `Previous`, onClick → `onReturnToMenu?.()`.
  - Else: label `Previous`, onClick → `handlePrev()`.
  - Remove the duplicate `Previous` from the right-side button cluster (since it now lives on the left). Keep `hidePreviousButton` exception for `[data-tour="game-setup"]` by rendering a spacer instead so `Next/Done` stays right-aligned.
- Style: use `variant="outline"` size `sm`, consistent with existing Previous styling, aligned left via the existing `justify-between` flex row.
- Welcome menu block (lines ~238-242) is untouched — `Skip` remains there.

**`src/pages/Index.tsx`, `src/pages/SessionForm.tsx`, `src/pages/LiveSession.tsx`**
- Wire the new `onReturnToMenu` prop on every `<OnboardingTour>` instance to call the hook's `returnToMenu()` from `useOnboardingTour()`.

## Files Edited

- `src/hooks/useOnboardingTour.ts`
- `src/components/onboarding/OnboardingTour.tsx`
- `src/pages/Index.tsx`
- `src/pages/SessionForm.tsx`
- `src/pages/LiveSession.tsx`

## Out of Scope

- No changes to step content, path definitions, or pagination dot logic.
- The `Done` label on the last step of every path is preserved.
