

## Multi-Action Weighted Splits for Hand Range Cells

### What changes
Replace the current simple string-based cell state (`"raise"`, `"call/raise"`) with a structured weighted-action system. Each cell stores an array of `{ action, weight }` entries, rendered as horizontal segments proportional to their weights. A new modal allows precise mix editing per cell.

### New data model

Current: `rangeState[hand] = "raise"` or `"call/raise"`

New: `rangeState[hand]` stores a JSON-serializable structure:
```typescript
type CellAction = { action: string; weight: number };
// Stored as JSON string in rangeState: 
// Single: "raise" (backward-compat)
// Mixed: '[{"action":"raise","weight":20},{"action":"call","weight":50},{"action":"fold","weight":30}]'
```

Helper functions parse/serialize so the `Record<string, string>` type stays the same (no DB schema change). Simple single-action strings remain valid.

### Visual rendering (horizontal segments, not diagonal)

Each cell renders horizontal color bands proportional to weights:
```
┌──────────┐
│  Raise   │  20% height
│──────────│
│   Call   │  50% height  
│──────────│
│   Fold   │  30% height
└──────────┘
```

Implemented via CSS `linear-gradient(to bottom, ...)` with percentage stops. Hand label rendered on top with text-shadow for readability.

For 1 action: solid background (unchanged).
For 2 actions: two horizontal bands.
For 3 actions: three horizontal bands.

### New: Cell Mix Editor Modal

A small dialog/sheet that opens when a cell is **long-pressed** (or tapped while in a new "mix edit" mode):
- Shows the hand name (e.g., "AKs")
- Lists available actions (Raise, Call, Fold — or whatever actions the node supports)
- Each action has a slider (0-100%) or increment buttons
- Total must equal 100% — auto-adjust the last/largest segment
- "Apply" saves the mix; "Clear" resets to fold

### Interaction changes

**Paint mode (single-click)** — remains fast, sets cell to 100% of the paint action. If already that action, resets to fold.

**Mix edit mode** — new button in the legend area: a "Mix" brush icon. When active, tapping a cell opens the Cell Mix Editor modal for that specific hand.

**Cycle mode (no brush selected)** — cycles through simple actions only (raise → call → fold). For detailed mixes, user uses the mix editor.

**Range-fill (double-click)** — still works, applies 100% of the paint action.

### Files changed

**1. `src/components/charts/HandRangeGrid.tsx`**
- Add `parseCellAction(value: string): CellAction[]` — parses both legacy strings and JSON arrays
- Add `serializeCellAction(actions: CellAction[]): string` — serializes back
- Replace `getMixedStyle()` with `getCellStyle(actions: CellAction[])` using horizontal gradient stops
- Add `availableActions` prop (defaults to `['raise', 'call', 'fold']`)
- Add `onCellLongPress` or `onMixEdit` callback
- Render cells with new gradient logic; show hand label with `text-shadow` for contrast

**2. `src/components/charts/CellMixEditor.tsx`** (new file)
- Small dialog component
- Props: `hand: string`, `currentMix: CellAction[]`, `availableActions`, `onSave`, `onClose`
- Renders a slider or +/- stepper per action (increments of 5% or 10%)
- Enforces total = 100%
- Clean, compact mobile-friendly design

**3. `src/components/charts/CreateSolutionSheet.tsx`**
- Add "Mix" button to the legend/brush row (alongside Raise, Call, Fold)
- Add state for `mixEditHand` — which hand is being mix-edited
- When mix mode is active and cell is tapped, open `CellMixEditor` for that hand
- Update `handleSave` validation to accept mixed cells (not just raise/call)

**4. `src/components/charts/SpotDetailView.tsx`**
- Update legend to show "Mixed" with a horizontal multi-band indicator instead of diagonal
- Read-only grid automatically renders mixed cells from saved data

**5. `src/hooks/useChartsLibrary.ts`**
- No changes needed — `range_data` is already `jsonb`, stores any structure

### Color map (extensible)
```typescript
const ACTION_COLORS: Record<string, string> = {
  raise: 'rgba(239,68,68,0.85)',
  call: 'rgba(16,185,129,0.75)',
  fold: 'rgba(30,58,138,0.5)',
  '3bet': 'rgba(168,85,247,0.8)',  // purple, for future use
};
```

New actions can be added to this map and to the `availableActions` prop without code changes to the grid.

### Backward compatibility
- Legacy `"raise"` strings parse as `[{action:"raise", weight:100}]`
- Legacy `"call/raise"` strings parse as `[{action:"call", weight:50}, {action:"raise", weight:50}]`
- New data saves as JSON array strings — old code that checks `v === 'raise'` in `handleSave` will be updated

