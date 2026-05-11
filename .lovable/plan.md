## Goal

Make the tour UI render correctly inside the End Table modal so Step 1 (Total Payout) and Step 2 (yellow End Table button) are visible and interactive, then auto-resume on the dashboard at the "Finishing Up" step after the modal closes.

## Root cause

The Radix Dialog (`DialogOverlay` + `DialogContent`) is `z-50`. The tour root overlay is `z-[100]`. When `EndTableDialog` opens, the tour's full-screen layer sits ABOVE the dialog, so the dialog (and its `[data-tour="end-table-cashout"]` / `[data-tour="end-table-confirm"]` anchors) is visually covered. The spotlight's existing trick of setting `el.style.zIndex='101'` on the target (and `data-tour-allow` elements) doesn't escape the dialog's `z-50` stacking context, so nothing pops above the dim layer.

Both tooltip copy and the auto-advance gate (`v >= 0`) are already correct from prior edits; only the layering needs fixing.

## Changes

### `src/components/onboarding/OnboardingTour.tsx`

Add an effect that runs whenever the active step changes. When the target element for the current step lives inside a Radix Dialog portal (walk up from the resolved target to the closest `[role="dialog"]` node, then to that node's portal wrapper — typically the parent of the overlay + content), temporarily promote the dialog above the tour:

- Find the portal container (the closest ancestor that is either the `[role="dialog"]` element itself or its direct parent if it contains the matching `[data-radix-portal]` / overlay sibling).
- Save its current `position`, `zIndex`.
- Set `position: relative` (if static) and `zIndex: 200` so the entire dialog subtree renders above the tour root (`z-[100]`).
- Also set `zIndex: 200` on the sibling `DialogOverlay` element so its dim layer doesn't sit behind the tour bands.

In the same effect, raise the tour root container's z-index to `z-[210]` (via a state flag passed to the root `<div>`'s className) so the spotlight bands, hand-tap animation, and tooltip render above the elevated dialog. Restore everything on cleanup / step change.

No changes to the bands/tooltip computation — they already anchor to `rect`, which `readRect()` derives from `getBoundingClientRect()` on the live target inside the dialog, so the spotlight will correctly hug the Total Payout input (Step 1) and the yellow End Table button (Step 2).

The hand-tap animation already renders for both `isEndTableCashoutStep` and `isEndTableConfirmStep` (prior edit), and the one-shot click listener on `[data-tour="end-table-confirm"]` already advances to the next step (`live-controls` = "Finishing Up") while `EndTableDialog`'s own `onConfirm` closes the modal — so once the layering is fixed, the full flow works end-to-end.

## Out of scope

- No changes to `EndTableDialog.tsx`, `tourSteps.ts`, or the `useOnboardingTour` hook.
- No new selectors. No copy changes (already shipped).
- No change to the cashout `v >= 0` auto-advance gate (already shipped).
