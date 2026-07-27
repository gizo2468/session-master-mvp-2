## Move "End Session" Button to Session Details Card

Relocate the red **End Session** button from the top action row inside `SessionTimerCard` to the `SessionDetailsCard`, placed directly below the **Share with Coach** button. All tutorial hooks, tap targets, click handlers, and disabled logic stay wired to the same button — just at its new location.

### Files to change

**1. `src/components/poker/SessionDetailsCard.tsx`**
- Add an optional `onEndSession?: () => void` prop.
- Directly below the existing "Share with Coach" block, add a centered container rendering the End Session button:
  - Reuse the exact same markup as today: `variant="destructive"`, `CircleStop` icon, label "End Session".
  - Wrap it in the existing `data-tour="live-controls"` div so the tour anchor moves with it.
  - Center it in the card with matching spacing (`flex justify-center pt-1`) so it aligns visually with the Share button above.
  - Click handler calls `onEndSession?.()` (same behavior as before — opens the End Session sheet).

**2. `src/components/poker/SessionTimerCard.tsx`**
- Remove the End Session `<Button>` and its `data-tour="live-controls"` wrapper from the top action row.
- Rebalance the top row so **Add Table** looks intentional on its own:
  - Replace the `grid grid-cols-2` with a centered layout (`flex justify-center`) and constrain Add Table width (`w-full max-w-[220px]`) so it matches the visual weight of the bottom BB/Stack + Upload Hand column.
- Keep `onEndSession` prop on `SessionTimerCard` but no longer render a button for it (prop still forwarded from `LiveSession` for backward compatibility — will be unused here).
- `handleEndSession` local handler can be removed.

**3. `src/pages/LiveSession.tsx`**
- Pass `onEndSession={() => sessionActions.setShowEndSessionSheet(true)}` to `<SessionDetailsCard>` (in addition to / instead of the timer card).
- Keep everything else identical: `EndSessionSheet` mount, `sessionActions.handleEndSession`, and the `EndTableTapHint` are unchanged.

### What is intentionally NOT changed

- Button text, color, icon, size, and behavior — identical.
- `EndSessionSheet` component and all its tour steps/tap-hand logic on `[data-tour="end-session-summary"]` / `[data-tour="end-session-confirm"]` — those live inside the sheet, not on the trigger button, so they continue to work.
- Tour step `live-controls` in `tourSteps.ts` — selector `[data-tour="live-controls"]` still resolves correctly because the attribute travels with the button.
- Any dialog, navigation, active-table validation, or session-end flow — all downstream of `onEndSession`, unchanged.

### Verification

- `tsgo` typecheck and build.
- Manual visual check: End Session sits centered under Share with Coach; top area shows a single centered Add Table above the BB/Stack + Upload Hand column.
- Run the End Session tutorial once — the highlight should now spotlight the button inside Session Details, and completing the flow still returns to Home and shows the completion dialog.
