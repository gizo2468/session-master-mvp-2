## Goal
Make the onboarding step for **Total Payout** render above the End Table Radix dialog and anchor directly to the actual input field instead of falling to the bottom-center fallback position.

## What will change

### 1. Render the tour at the true top layer
Update `src/components/onboarding/OnboardingTour.tsx` so the entire tour UI renders through a **React portal to `document.body`** instead of inside each page component tree.

Why:
- Right now `OnboardingTour` is mounted inside `LiveSession.tsx` / `Index.tsx` / `SessionForm.tsx`.
- Radix `DialogContent` and `DialogOverlay` are portaled to `document.body`.
- Even with a larger z-index, the in-page tour can still lose to the modal portal / stacking context behavior.

Implementation:
- Import `createPortal` from `react-dom`.
- Wrap the existing tour root/menu root in a portal targetting `document.body`.
- Keep the tour root at a very high z-index during modal steps (`z-[99999]` / inline `zIndex: 99999` if needed).
- Raise `[data-tour-allow="true"]` lifted elements above that same ceiling.

### 2. Anchor the cashout step to the actual input, not the wrapper
Update the **cashout tour step selector** so the step targets the real Total Payout field instead of the outer wrapper.

Why:
- The current step selector is `[data-tour="end-table-cashout"]`.
- In `EndTableDialog.tsx`, that attribute is on the whole modal body wrapper (`<div className="py-4" ...>`), not the input.
- The tour therefore measures a large block, while the hand icon separately tries to aim at `[data-tour="end-table-cashout"] input`, causing inconsistent geometry.

Implementation options:
- Preferred: move the step selector in `tourSteps.ts` to `#tableCashout` or a dedicated stable attribute on the input such as `data-tour="end-table-cashout-input"`.
- Keep the existing wrapper-level `data-tour="end-table-cashout"` only if it is still needed for modal-detection / flow wiring.
- Update all cashout-step-specific queries in `OnboardingTour.tsx` to use the same single source of truth selector.

### 3. Make rect measurement modal-aware
Refine the measurement path in `OnboardingTour.tsx` so modal steps read the **final post-animation input rect** and do not fall back to centered tooltip placement.

Implementation:
- Add a resolver/helper for the current step target element instead of mixing `step.selector`, hardcoded input queries, and generic wrapper lookups.
- Use that same resolver in:
  - `readRect()`
  - `stepInsideDialog` detection
  - `ResizeObserver` setup
  - focused-input freeze logic
  - cashout hand-position logic
- For modal steps, re-measure after the dialog settles (existing timeout/listeners stay, but now they re-read the input rect, not the wrapper rect).
- If the target is missing temporarily, keep polling; do not reveal tooltip until a real rect exists.

### 4. Prevent the bottom-center fallback for this modal step
Adjust tooltip reveal behavior so the cashout step does not show the card in the generic centered fallback state while the modal target is still unresolved.

Implementation:
- For modal steps, gate tooltip visibility on a valid rect from the resolved target.
- Only compute tooltip placement from the resolved spotlight box.
- This prevents the text from bleeding out underneath the dialog at the bottom of the viewport.

## Files to update
- `src/components/onboarding/OnboardingTour.tsx`
- `src/components/onboarding/tourSteps.ts`
- `src/components/poker/EndTableDialog.tsx`

## Verification
1. Start the onboarding flow and reach **Active Tables**.
2. Tap the red **End Table** button.
3. Confirm the End Table dialog opens and the tour immediately advances.
4. Confirm the spotlight/tooltip render **above** the Radix overlay and dialog.
5. Confirm the tooltip is positioned next to the **Total Payout** input, not bottom-center.
6. Enter a payout value and confirm the tour advances to the next modal step.
7. Re-check non-modal tour steps for regressions.

## Technical notes
- This keeps the current modal-step flow logic, but fixes the two structural causes: incorrect mount layer and incorrect target selector.
- No backend or database changes are needed.