

## Improve Visibility of Empty "Add Chart" Cells

### What
Make the dashed placeholder cells with the "+" icon more visible and obviously clickable, without changing layout or logic.

### Change — single file: `src/components/charts/PositionMatrix.tsx`

**Line 114** — Update the empty cell classes for user-owned spots:
- Border: `border-muted-foreground/20` → `border-muted-foreground/40` (stronger dashed outline)
- Hover border: `hover:border-primary/40` → `hover:border-primary/60`
- Text/icon color: `text-muted-foreground/50` → `text-muted-foreground/70`
- Hover text: `hover:text-primary/60` → `hover:text-primary`

**Line 122** — Make the Plus icon more visible:
- Size: `h-3 w-3` → `h-4 w-4` (slightly larger)
- Remove `opacity-30` (was making it nearly invisible)
- Add `opacity-60` instead for a visible but still subtle look

Two line changes, one file. No layout, structure, or logic changes.

