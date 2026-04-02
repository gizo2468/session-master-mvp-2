

## Improve Hand Range Grid: Mobile Layout + Mixed Actions

### Two enhancements

**1. Mobile-responsive grid**

The current cells use fixed sizes (`w-8 h-8` on mobile, `w-9 h-9` on sm+). On a 390px viewport, 13 columns × 32px + gaps = ~420px, causing overflow/cramping.

Fix in `HandRangeGrid.tsx`:
- Replace fixed cell sizes with responsive approach: use `aspect-square w-full text-[7px] sm:text-[10px]` so cells fill available width
- Change the grid container from `inline-grid` to `grid w-full` so it stretches to fill its parent
- Keep `grid-cols-13` and `gap-[1px]`
- Remove the old `cellSize` variable with its fixed `w-` classes
- On compact mode, use even smaller text (`text-[6px]`)

This makes the 13×13 grid fluid — each cell becomes 1/13th of the container width, always fitting the screen.

**2. Mixed-action cell support**

Allow cells to hold two actions (e.g., 50% raise + 50% call) with a diagonal or horizontal split visual.

Data model change:
- `rangeState` values currently store a single string like `"raise"`. Mixed actions will be stored as `"raise/call"` (slash-separated, sorted alphabetically for consistency)
- This is backward-compatible — single actions remain as-is

Interaction:
- When in paint mode and a cell already has a *different* action (not fold, not the paint action), clicking it creates a mixed state combining both actions
- Example: cell is `"raise"`, paint mode is `"call"` → cell becomes `"call/raise"`
- Clicking a mixed cell that already contains the paint action removes that action, leaving the other one
- Clicking a fold cell applies the paint action normally
- Without paint mode, cycle behavior: fold → raise → call → raise/call → raise/fold → call/fold → fold

Visual rendering:
- Single action: full background color (unchanged)
- Mixed action: CSS diagonal gradient — top-left triangle is action 1, bottom-right is action 2
- Use `background: linear-gradient(135deg, color1 50%, color2 50%)` via inline style
- Color map: raise → `rgb(239 68 68 / 0.8)`, call → `rgb(16 185 129 / 0.7)`, fold → `rgb(30 58 138 / 0.4)`

### Files changed

**`src/components/charts/HandRangeGrid.tsx`**
1. Replace fixed `cellSize` with responsive classes: `aspect-square w-full text-[7px] sm:text-xs`
2. Change container to `grid w-full grid-cols-13 gap-[1px]`
3. Add `ACTION_COLORS` map (hex/rgb values for inline gradient styles)
4. Add `parseMixedAction()` and `formatMixedAction()` helpers
5. Update `handleCellClick` paint-mode logic to support creating/toggling mixed states
6. Update cell rendering: if action contains `/`, render with diagonal gradient via inline `style={{ background: ... }}`; otherwise use existing Tailwind classes
7. Update `cycleAction` to include mixed states in the cycle

**`src/components/charts/CreateSolutionSheet.tsx`**
- Update legend to show a 4th "Mixed" indicator or add a note explaining mixed behavior
- No other changes needed — `rangeData` dict just holds string values

**`src/components/charts/SpotDetailView.tsx`**
- Update legend to include "Mixed" indicator
- HandRangeGrid used in read-only mode will render mixed cells from saved data automatically

### Technical details

```typescript
const ACTION_COLORS: Record<string, string> = {
  raise: 'rgba(239,68,68,0.8)',
  call: 'rgba(16,185,129,0.7)',
  fold: 'rgba(30,58,138,0.4)',
};

function getMixedStyle(action: string) {
  if (!action.includes('/')) return null;
  const [a1, a2] = action.split('/');
  return {
    background: `linear-gradient(135deg, ${ACTION_COLORS[a1]} 50%, ${ACTION_COLORS[a2]} 50%)`,
  };
}
```

Cell rendering pseudo-code:
```tsx
const mixedStyle = getMixedStyle(action);
<button
  className={cn('aspect-square w-full ...', !mixedStyle && TIER_COLORS[action])}
  style={mixedStyle || undefined}
>
  {hand}
</button>
```

Paint mode click logic:
```
if cell is fold → set to paintMode
if cell equals paintMode → set to fold  
if cell is single action ≠ paintMode → set to mixed (sorted: "action/paintMode")
if cell is mixed containing paintMode → remove paintMode, keep other
if cell is mixed not containing paintMode → replace with paintMode
```

