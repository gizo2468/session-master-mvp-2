

## Update Card Color System for Dark Mode

### Problem
The `CardDisplay` component has conflicting dark mode classes (`dark:bg-gray-50 dark:bg-background` — the second overrides the first, making cards dark-on-dark). Suit colors are too muted, and rank text has no explicit color, inheriting the parent's color which can be unreadable on a light card face.

### Single file change: `src/components/poker/CardDisplay.tsx`

**Line 58 — Card container classes:**
- Remove conflicting `dark:bg-gray-50 dark:bg-background`
- Set to `bg-white dark:bg-gray-100` — always a clean light card face
- Upgrade border: `border-gray-400` → `border-gray-300 dark:border-gray-500` for subtle premium framing
- Add `dark:shadow-md dark:shadow-black/30` for depth against dark backgrounds

**Line 34-50 — Suit colors:**
- Hearts/Diamonds: `text-red-600` → `text-red-600 dark:text-red-500` (brighter, more saturated red in dark mode)
- Spades/Clubs: `text-gray-900 dark:text-gray-100` → `text-gray-900 dark:text-gray-900` (keep them dark/black since the card face is light)

**Line 60 — Rank text:**
- Add explicit `text-gray-900` so rank is always dark on the light card face, regardless of parent color context

### Result
- Card face stays light and clean in both modes
- Red suits are vivid and saturated
- Black suits are solid black (not washed-out gray)
- Rank text is always high-contrast
- Applied globally since all 11+ files import from this single component

