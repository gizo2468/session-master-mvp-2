## Goal
After the user taps the red **End Table** button during the Active Tables tutorial, the End Table modal opens and a tour tooltip immediately highlights the **Total Payout** input with the new copy. The user is blocked from submitting until they enter a value (which also auto-advances the tour).

## Current state (already in place)
The whole pipeline is already wired — no new infrastructure is needed:

- `EndTableDialog.tsx` already exposes `data-tour="end-table-cashout"`, `end-table-profit`, `end-table-notes`, `end-table-confirm`.
- `tourSteps.ts` already has an `end-table-cashout` step in the `start-session` path (right after `table-actions`).
- `OnboardingTour.tsx` already:
  - Auto-advances from the **Active Tables** step the moment the End Table dialog mounts (MutationObserver on `[data-tour="end-table-cashout"]`).
  - Hides the **Next** button on the cashout step (`hideNextButton` includes `isEndTableCashoutStep`) so the user must interact with the input.
  - Auto-advances the cashout step the moment a finite numeric value is typed into the Total Payout input.
  - Shows the looping tap-hand over the input.
- `EndTableDialog.tsx` already disables the yellow **End Table** submit button while `cashOutAmount` is empty, so the user physically cannot submit before fulfilling the tour requirement.

## The only change needed

### `src/components/onboarding/tourSteps.ts`
Update the `end-table-cashout` step copy (currently *"Enter the total amount you cashed out (or 0 if you were eliminated)..."*) to the requested text:

> **Title:** Total Payout
> **Body:** "Enter your final cash-out amount here to calculate your net profit or loss for this table."

No other step properties change (`interactive`, `compact`, `route: '/session'`, `placement: 'below'` stay the same).

## Why no other code changes
- "Appear automatically as soon as the modal opens" → already handled by the existing MutationObserver-based auto-advance from the Active Tables step.
- "Block the user from clicking the yellow End Table submit button" → already handled by the dialog's `disabled` prop on the submit button (requires a non-empty `cashOutAmount`). Combined with the cashout step auto-advancing on input, the gating is implicit and automatic.
- "Advance past this tutorial step (or enter a value)" → entering a value advances the tour; the Next button is intentionally hidden so the user is nudged to type a value, which is also the only way to enable the submit button.

## Out of scope
- The downstream `end-table-profit`, `end-table-notes`, and `end-table-confirm` steps. They already work and are not part of this request.
- Any styling / placement tweaks of the tooltip card.

## Verification
1. Run the start-session tour through to **Active Tables** → tap red **End Table** → modal opens → tooltip immediately appears below the **Total Payout** input with the new copy.
2. Yellow **End Table** submit stays disabled while Total Payout is empty.
3. Type any numeric value (e.g. `0`, `120`) → tour advances to **Profit / Loss**, submit becomes enabled.
