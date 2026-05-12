## Goal
Make the onboarding tutorial continue inside the End Table dialog and reliably highlight the Total Payout step, instead of stopping after the user taps End Table.

## What I’ll change
1. Update the tutorial handoff logic in `OnboardingTour.tsx` so it reacts to the End Table button the user actually tapped, not just the first matching button on the page.
2. Make the End Table tutorial flow resilient to alternate dialog entry states:
   - if the dialog opens directly on Total Payout, continue there
   - if the dialog opens on an intro/reason-selection screen first, wait for that flow to reveal Total Payout instead of silently stalling
3. Keep the spotlight/tooltip/tap-hand anchored to the Total Payout input once that field is visible inside the dialog.
4. Verify the Live Session page still renders the onboarding overlay for the session-route steps without changing unrelated tutorial behavior.

## Technical details
- `OnboardingTour.tsx`
  - Replace the single `document.querySelector('[data-tour="end-table-button"]')` binding with logic that supports multiple End Table buttons.
  - Tie progression to the clicked button / resulting dialog state instead of assuming the first button is always the correct one.
  - Expand the dialog-step waiting logic so the tour doesn’t die when the modal first shows a different screen before `data-tour="end-table-cashout"` appears.
  - Preserve the existing high z-index + dialog-safe spotlight behavior.
- `EndTableDialog.tsx`
  - If needed, add a stable tour anchor for the intro state so the controller can detect that the dialog did open even before Total Payout is available.
- `tourSteps.ts`
  - Keep the requested ordering centered on Total Payout as the first in-dialog tutorial highlight once that section exists.

## Expected result
After tapping End Table from Active Tables, the tutorial will keep running in the popup and will highlight the Total Payout section as requested instead of appearing to stop.