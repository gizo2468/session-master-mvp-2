## Diagnosis
**Do I know what the issue is? Yes.**

The big problem is not just z-index. The app currently has **two different End Table modal implementations**:

- `src/components/poker/TableCard.tsx` opens its **own local inline Dialog**
- `src/pages/LiveSession.tsx` also mounts a separate shared `src/components/poker/EndTableDialog.tsx`

Both dialog implementations contain the same tutorial markers:
- `data-tour="end-table-cashout"`
- `data-tour="end-table-confirm"`

So the onboarding system is trying to follow a flow that is **split across duplicate modal systems**, which makes the selector-based tutorial fragile and is the likely reason it keeps freezing or showing only a dark shade instead of reliably continuing into the popup.

## What to change
1. **Use one End Table modal only**
   - Remove the local End Table dialog flow from `TableCard.tsx`
   - Route the red **End Table** button through the centralized `useEndTableActions` + `EndTableDialog.tsx` flow used by `LiveSession.tsx`
   - Keep only one source of truth for modal open state and confirm/cancel behavior

2. **Keep tutorial markers only on the real shared dialog**
   - `data-tour="end-table-cashout"` and `data-tour="end-table-confirm"` should exist in exactly one modal implementation
   - Remove duplicate tutorial targets from `TableCard.tsx` so `querySelector()` can never lock onto the wrong DOM branch

3. **Rewire the Active Tables step to the shared modal flow**
   - The red **End Table** button inside `TableCard.tsx` should call a passed-in handler like `onInitiateEndTable(table.id)` instead of toggling local dialog state
   - The tutorial step for `table-actions` should advance into the centralized popup flow

4. **Harden the transition in `OnboardingTour.tsx`**
   - Keep the stale-rect fix already identified
   - Ensure the tour only renders interactive spotlight layers after the shared modal target has mounted
   - Make the Active Tables → popup transition tolerant to the short render gap

5. **Validate the exact sequence end-to-end**
   - Active Tables step shows the red button highlight
   - Tapping red **End Table** opens the popup and continues tutorial inside it
   - Step 1 highlights **Total Payout** with hand-tap
   - Entering a value advances to Step 2 highlighting the yellow **End Table** button
   - Tapping yellow **End Table** closes the popup and continues to **Finishing Up**
   - No stuck dark overlay remains

## Files likely involved
- `src/components/poker/TableCard.tsx`
- `src/components/poker/EndTableDialog.tsx`
- `src/pages/LiveSession.tsx`
- `src/hooks/useEndTableActions.ts`
- `src/components/onboarding/OnboardingTour.tsx`

## Why previous fixes didn’t stick
They were mostly trying to patch **overlay behavior**, but the underlying flow still had **two competing modal implementations with duplicated tutorial anchors**. That means even a correct overlay fix can still fail because the tour may be targeting the wrong popup structure.