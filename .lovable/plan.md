Plan: Update the "Add Hand" button icon in the Active Table card.

Verified current state:
- The "Add Hand" button is rendered by `src/components/poker/HandManagementPanel.tsx` at lines 208–215.
- It currently imports and uses `<Plus className="h-4 w-4 mr-2" />` with the text "Add Hand".
- The "Upload Hand" button in `src/components/poker/SessionTimerCard.tsx` uses `<Icon name="Hand" size={14} />`, confirming the hand icon is available from `lucide-react`.

Implementation:
- In `src/components/poker/HandManagementPanel.tsx`:
  1. Add `Hand` to the `lucide-react` import (currently imports `Plus, FileText, ChevronRight`).
  2. Replace `<Plus className="h-4 w-4 mr-2" />` with `<Hand className="h-4 w-4 mr-2" />` on the Add Hand button.
- Keep the "Add Hand" text unchanged.
- Keep button size, colors, spacing, position, and functionality unchanged.

Validation:
- Run the TypeScript/typecheck and/or a quick build check to ensure the import and icon are valid.
- No other files need modification.