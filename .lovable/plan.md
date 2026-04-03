
Fix Hand Result in the main hand list for both Live Session and Closed Sessions.

What I found
- Both screens route through the same list renderer:
  - Live Session: `TableCard` → `HandManagementPanel` → `HandsList`
  - Closed Session: `SessionDetail` → `HandManagementPanel` → `HandsList`
- The real UI blocker is `src/components/poker/HandsList.tsx`: it only shows the Result cell when `hand.resultAmount !== undefined`.
- But the hand form primarily saves the hand result as `resultValue`, `resultUnit`, and `showdownResult` (for example `+85 BB`), which is why Hand Details can show it while the main row stays blank.
- Reloaded/existing hands are also inconsistent because `sessionConverter.ts` restores `resultValue/resultUnit/showdownResult`, but does not restore `resultAmount`.
- There is also a sync gap: `handlers.ts` normalizes result fields locally, but `updateTableHand` still sends the raw hand to Supabase, and `sessionSaver.ts` / `handSync.ts` can still persist `amount_won` as `0` when only `resultValue` exists.

Implementation plan
1. Update `src/components/poker/HandsList.tsx`
   - Add a small helper to derive the displayed hand result.
   - Display priority:
     1. `showdownResult` (exact saved text, e.g. `+85 BB`)
     2. `resultValue + resultUnit`
     3. legacy numeric fallback from `resultAmount` / `amountWon`
   - Keep the same row layout and styling; only change the data source for the Result cell.

2. Update `src/context/session/handlers.ts`
   - Normalize hand result fields on both add and edit so these stay aligned:
     - `resultValue`
     - `resultUnit`
     - `showdownResult`
     - `resultAmount`
     - `amountWon`
   - In `updateTableHand`, send the normalized hand object to Supabase sync instead of the raw pre-normalized one.

3. Update `src/utils/database/sessionConverter.ts`
   - When loading hands from DB, populate `resultAmount` from the saved hand-result fields so existing and reopened hands render correctly in the main list.

4. Update `src/utils/database/sessionSaver.ts`
   - Persist `amount_won` using the normalized hand result fallback, not only `amountWon || 0`.

5. Update `src/utils/handSync.ts`
   - Apply the same fallback logic for direct hand sync so cloud data, reopened sessions, and immediate UI all stay consistent.

Expected result
- If a hand has `+85 BB` in Hand Details, that same saved result will appear in the main Result column.
- It will work immediately after save.
- It will work for newly created hands and existing hands.
- It will remain visible after closing the modal, navigating back, and reopening the session.
- No layout/design changes; only the result data flow and rendering logic are fixed.

Technical note
- The safest fix is to make one shared rule everywhere:
  - display from `showdownResult` first
  - fall back to `resultValue/resultUnit`
  - fall back to legacy numeric fields
- That directly fixes the mismatch where Hand Details already knows the saved result, but the main list ignores it.
