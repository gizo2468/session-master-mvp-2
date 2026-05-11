## Goal

Now that the End Table modal opens correctly during the tour, add a proper "End Table" tutorial stage — like a sibling to the Active Tables stage — with an intro step plus highlighted fields for Total Payout, Profit/Loss, Notes, and the End Table confirm button.

## Changes

### 1. `src/components/poker/EndTableDialog.tsx`
Add two new `data-tour` anchors so the tour has stable targets inside the modal:
- `data-tour="end-table-intro"` on the `DialogContent` wrapper (intro step highlights the whole modal).
- `data-tour="end-table-profit"` on the Profit/Loss block (lines 198–231).
- `data-tour="end-table-notes"` on the Notes (Optional) block (lines 234–247).

(`end-table-cashout` and `end-table-confirm` already exist.)

### 2. `src/components/onboarding/tourSteps.ts`
Replace the current two End Table steps with a 5-step End Table stage inserted right after the `table-actions` step, before `live-controls`:

1. **End Table** — selector `[data-tour="end-table-intro"]`, title "End Table", body "This is where you finalize a table. Fill in your payout and any details before closing it."
2. **Enter Your Payout** — selector `[data-tour="end-table-cashout"]`, placement `below`, body "Enter the total amount you cashed out (or 0 if you were eliminated)."
3. **Profit / Loss** — selector `[data-tour="end-table-profit"]`, placement `below`, body "We instantly calculate your result against your buy-in so you can see how the table went."
4. **Notes (Optional)** — selector `[data-tour="end-table-notes"]`, placement `above`, body "Add quick notes about the table — table dynamics, key hands, opponents, anything worth remembering."
5. **Finalize This Table** — selector `[data-tour="end-table-confirm"]`, placement `above`, body "Tap End Table to save everything and close this table."

All steps: `interactive: true`, `route: '/session'`, `compact: true` (except the intro which can be non-compact so the title is prominent).

### 3. `src/components/onboarding/OnboardingTour.tsx`
- Add the new selectors (`end-table-intro`, `end-table-profit`, `end-table-notes`) to the existing modal-aware retry list so they get the long retry window like the other modal-step selectors.
- For the intro and notes/profit steps, no special advancement handler is needed — they advance via the normal Next click since the modal is now correctly layered.

## Out of scope

- No business logic changes to EndTableDialog (payout calc, validation, submit).
- No styling changes beyond adding `data-tour` anchors.
- No changes to other tour stages.

## Validation

1. Start a live session with a table, run the tour from Active Tables.
2. Tap End Table → modal opens, intro step highlights the whole modal.
3. Next → Total Payout highlighted.
4. Next → Profit/Loss highlighted.
5. Next → Notes highlighted.
6. Next → End Table confirm button highlighted.
7. Confirming closes the modal and the tour continues to `live-controls`.
