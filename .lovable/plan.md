Plan: Revert only the "Active Tables (n)" heading to its previous font size while leaving "Session Details" enlarged.

Verified current state:
- `src/components/poker/LiveSessionTables.tsx` line 32 currently renders "Active Tables (n)" with `text-2xl font-bold mb-2 text-poker-gold`.
- Its previous size was `text-xl`.
- `src/components/poker/SessionDetailsCard.tsx` line 85 remains at `text-2xl` and should not be changed.

Implementation:
- In `src/components/poker/LiveSessionTables.tsx`: Change the `h4` class from `text-2xl` back to `text-xl`.
- Keep `font-bold mb-2 text-poker-gold` unchanged.
- Do not modify `SessionDetailsCard.tsx` or any other file.

Validation:
- Confirm the heading text remains on one line at mobile viewport widths.
- Run a quick type/build check to ensure no class errors.