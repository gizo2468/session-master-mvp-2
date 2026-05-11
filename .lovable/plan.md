## Goal
Fix the onboarding tutorial so tapping the red **End Table** button opens the actual **End Table** modal and the tutorial continues inside that popup instead of leaving the screen under a black fade.

## What is actually broken
The main issue is the **layer order inside `OnboardingTour.tsx`**:
- the tour tries to “lift” the Radix dialog to `z-index: 200`
- but when that happens, the **entire tour overlay root** is moved to `z-[210]`
- that puts the dark tutorial layer back **above** the dialog again
- result: the modal mounts, but it is visually buried behind the tutorial fade, so the user mostly sees a dark/black overlay instead of the End Table popup

There is also a secondary reliability issue:
- some modal-step effects still use direct `document.querySelector(...)`
- that makes the modal step measurement less stable than the newer visible-element lookup during the handoff from button -> dialog -> cashout field

## Plan
### 1. Fix the z-index/layering model for tutorial modal steps
Update `src/components/onboarding/OnboardingTour.tsx` so the tutorial no longer raises the **entire** overlay above the dialog.

Instead:
- keep the **dim background / blocker layer** below the lifted Radix dialog
- keep only the **guide UI** that must remain visible (spotlight stroke, hand cue, tooltip if needed) in a separate layer
- ensure the lifted End Table dialog portal/content/overlay sits above the page but below only the non-blocking tutorial chrome

This will let the real End Table modal stay visible and interactive.

### 2. Harden modal target lookup during the End Table steps
In `src/components/onboarding/OnboardingTour.tsx`:
- replace remaining direct `document.querySelector(...)` lookups for modal-related steps with the visible-element helper where appropriate
- make the resize/focus/step handoff logic bind to the actual visible modal target
- keep the existing wait-for-dialog behavior, but ensure it measures the correct mounted node consistently

### 3. Add a stable dialog-level anchor if needed
If the current field/button anchors are still too fragile, add a stable marker on `src/components/poker/EndTableDialog.tsx` for the shared dialog content so the tour can reliably detect “the modal is open” before it measures step targets.

### 4. Verify the exact broken flow
Validate this sequence in the preview:
1. tutorial reaches **Active Tables**
2. user taps **End Table**
3. End Table modal becomes visibly open
4. **Total Payout** is highlighted inside the popup
5. entering a value advances the tour
6. **End Table** confirm button is highlighted
7. confirming closes the popup and the tutorial continues
8. no black/frozen fade remains

## Files likely involved
- `src/components/onboarding/OnboardingTour.tsx`
- `src/components/poker/EndTableDialog.tsx`

## Technical notes
- Radix Dialog does not guarantee automatic stacking above unrelated overlays; explicit portal layering is expected.
- The current bug is not Supabase or session-save related.
- This should stay a frontend-only fix focused on tutorial/modal coordination.