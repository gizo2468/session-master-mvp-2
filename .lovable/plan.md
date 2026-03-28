

## Night Mode — Revised Plan (Targeted Text Override)

### What changed from previous plan
Removed the broad `.text-poker-black`, `.text-gray-500`, `.text-gray-600` global overrides. Replaced with a single, scoped selector that only hits page-level `h1` titles — the only elements that actually sit directly on the dark background and need a color fix.

### Why `h1.text-poker-black` is safe
Every match of `text-poker-black` on an `h1` is a page title sitting directly on the `bg-gray-50` page background (Settings, Coach Dashboard, Session Form, etc.). The other uses of `text-poker-black` are on badges and button variants — those are `span`/`div` elements inside components with their own colored backgrounds, so `h1.text-poker-black` won't touch them.

### CSS overrides (`src/index.css`)
```css
/* Night Mode */
html.night-mode .bg-gray-50 {
  background-color: #111827 !important;
}

html.night-mode h1.text-poker-black {
  color: #f3f4f6 !important;
}
```

That's it for CSS. Two rules total — background + page titles only. Cards, badges, buttons, and all internal component text stay completely untouched.

### Files (same 4 as before)

| File | Action |
|---|---|
| `src/context/NightModeContext.tsx` | New — context, localStorage, class toggle on `<html>` |
| `src/index.css` | Add 2 CSS rules above |
| `src/App.tsx` | Wrap with `NightModeProvider` |
| `src/pages/Settings.tsx` | Add Appearance card with Night Mode toggle |

### Everything else unchanged
- White cards remain white with original text colors
- Layout, spacing, icons, buttons, data flow untouched
- No full dark theme

