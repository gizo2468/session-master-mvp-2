
Fix only the real screen the user is seeing.

What I found
- The selected End Table dialog in this flow is rendered from `src/components/poker/TableCard.tsx`, not from `src/components/poker/EndTableDialog.tsx`.
- `LiveSessionTables` renders `TableCard`, and the selected element points directly to the inline dialog inside `TableCard`.
- So the previous fix missed the real target. In `TableCard.tsx`, these fields still use generic dark classes and do not have the explicit high-contrast palette you requested.

Implementation
1. Update only the inline End Table form inside `src/components/poker/TableCard.tsx`.
2. Create local reusable class strings for this dialog only, so the styling stays isolated:
   - one for all inputs
   - one for the notes textarea
3. Apply your exact dark-mode colors to every field in this dialog:
   - Input background: `#1C1C1E`
   - Text color: `#FFFFFF`
   - Placeholder: `#8E8E93`
   - Default border: `#2C2C2E`
   - Focus border/ring: `#D4AF37`
   - Textarea background: `#141414`
4. Apply that styling to all fields in this specific screen:
   - Total Payout
   - Final Position
   - Players Eliminated
   - Total Bounty Collected
   - Next Day Start
   - Chips Carryover
   - Notes textarea
5. Also style the currency-prefix add-ons in this dialog so they match the input field dark palette and do not look lighter than the editable field.
6. Add scoped mobile/WebKit-safe dark input handling if needed on these fields only so typed text remains clearly white while editing, especially on iPhone/Safari-style inputs.

Scope protection
- Do not touch the global `Input` or `Textarea` components.
- Do not change `src/components/poker/EndTableDialog.tsx` for this request.
- No layout, spacing, structure, labels, or behavior changes.

Result
- This exact screen will get strong dark-mode contrast while typing.
- The form stays visually isolated to the Active Sessions > Active Tables > End Table flow only.

Validation
- Check in dark mode on the live session route:
  `Active Sessions -> Active Tables -> End Table`
- Confirm every field shows:
  - dark background
  - white typed text
  - muted gray placeholder
  - visible dark border
  - gold focus border
  - darker notes textarea
