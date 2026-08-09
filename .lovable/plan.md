# Dark Mode fix: card selection keyboard in Add New Hand

## Problem (verified)
In `src/components/poker/CardSelector.tsx`:
- The keyboard container (line 268) uses `bg-gray-100 dark:bg-muted`.
- The rank and suit buttons (lines ~287, ~324, ~362) also use `dark:bg-muted`.

In dark mode `--muted` is `0 0% 15%` and the modal surface is nearly the same, so container and buttons blend into each other and into the modal background.

## Fix (dark mode classes only)
1. Container: keep `bg-gray-100`, replace `dark:bg-muted` with a darker recessed panel plus a visible border — `dark:bg-black/40 dark:border dark:border-border` (border token is `0 0% 18%`; use a slightly stronger `dark:border-white/10` if needed for contrast).
2. Rank buttons (numbers/letters) and suit buttons: keep `bg-gray-300 hover:bg-gray-200` for light, change dark state to a raised surface `dark:bg-card dark:hover:bg-white/10 dark:border dark:border-white/10` so each key reads as a distinct button against the recessed panel.
3. Disabled/used keys: keep light styles; in dark use `dark:bg-muted/40 dark:text-muted-foreground` with existing opacity so they stay clearly "off" but readable.
4. Text stays `text-gray-800 dark:text-foreground`; red suits keep their existing red color.

## Scope
- Only `src/components/poker/CardSelector.tsx`, only `dark:` utility classes on the keyboard container and its buttons.
- No layout, spacing, size, or logic changes. Light mode classes untouched. Card slots, image upload, blinds, and the rest of the modal untouched.

## Validation
- View the Add New Hand modal in dark mode and confirm the keyboard panel is clearly separated with visible key buttons; confirm light mode is pixel-identical.
