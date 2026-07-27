Plan: Increase the font size of the "Session Details" and "Active Tables" headings on the Live Session page.

Verified current state:
- `src/components/poker/SessionDetailsCard.tsx` line 85 renders the "Session Details" heading with `text-xl font-bold text-poker-gold`.
- `src/components/poker/LiveSessionTables.tsx` line 32 renders the "Active Tables (n)" heading with `text-xl font-bold mb-2 text-poker-gold`.
- Both headings are currently the same size and must stay at the same size.

Implementation:
- In `src/components/poker/SessionDetailsCard.tsx`: Change the `CardTitle` class from `text-xl` to `text-2xl` (keep `font-bold text-poker-gold`).
- In `src/components/poker/LiveSessionTables.tsx`: Change the `h4` class from `text-xl` to `text-2xl` (keep `font-bold mb-2 text-poker-gold`).
- Keep color, font weight, alignment, wording, and surrounding spacing unchanged.
- Do not adjust container padding, margins, width, or layout.

Validation:
- Verify the headings render without wrapping on mobile viewport widths.
- Run a quick type/build check to ensure no class errors.
- No other files need modification.