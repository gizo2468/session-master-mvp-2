

## Improve Dark Mode Card Separation

### Problem
In dark mode, `--background` is `0 0% 7%` (#121212) and `--card` is `0 0% 11%` (#1C1C1C) — only 4% lightness difference. Border is `0 0% 18%` which is too faint. Dividers inherit the same faint border color. No glow/shadow distinguishes layers.

### Changes

**1. CSS variables — `src/index.css` (`.dark` block)**
- `--card`: `0 0% 11%` → `0 0% 13%` (slightly lighter, more separation)
- `--popover`: `0 0% 13%` → `0 0% 15%` (modals/dialogs lift further)
- `--border`: `0 0% 18%` → `30 5% 22%` (warmer, more visible)
- `--input`: same as new border value
- Add new custom property `--card-glow` for the warm gold shadow: `0 0px 12px 0 rgba(212, 175, 55, 0.06), 0 0px 4px 0 rgba(212, 175, 55, 0.04)`

**2. Card component — `src/components/ui/card.tsx`**
- Update dark shadow: `dark:shadow-black/20` → `dark:shadow-[var(--card-glow)]`
- Add slightly more visible dark border: `dark:border-[hsl(30,5%,22%)]` (already covered by the CSS var change, but reinforce with explicit class for clarity)

**3. Dialog component — `src/components/ui/dialog.tsx`**
- Add dark mode classes to `DialogContent`: `dark:bg-popover dark:border-[hsl(30,5%,22%)] dark:shadow-[0_0px_20px_0_rgba(212,175,55,0.08)]`

**4. Sheet component — `src/components/ui/sheet.tsx`**
- Add dark mode classes to the base cva string: `dark:bg-popover dark:shadow-[0_0px_20px_0_rgba(212,175,55,0.08)]`

**5. Separator/divider — `src/components/ui/separator.tsx`**
- Check current styling and add `dark:bg-[hsl(30,5%,24%)]` to make internal dividers more visible than the outer border

### What stays the same
- Light mode is untouched
- No layout, spacing, or structural changes
- All changes are dark-mode-only visual refinements

### Files touched
1. `src/index.css` — CSS variables
2. `src/components/ui/card.tsx` — gold glow shadow
3. `src/components/ui/dialog.tsx` — popover bg + glow
4. `src/components/ui/sheet.tsx` — popover bg + glow  
5. `src/components/ui/separator.tsx` — stronger divider color

