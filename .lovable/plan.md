

## Fix: Eliminate Black Circular Tap Flash on Home Chips

### Root Cause

The previous fix (removing `active:scale-95`) did not address the real issue. The black circular flash comes from two things working together:

1. **`transition-all`** on every chip button -- this transitions ALL CSS properties, including `background-color`. When the browser briefly applies its default active-state background to the button, `transition-all` makes it smoothly visible instead of instant/invisible.

2. **No explicit background** -- the buttons have no `background-color` set, so the browser's native `:active` background (dark/black) shows through the `rounded-full overflow-hidden` circular clip as a brief dark circle.

### Fix (two changes per button)

For all 4 chip buttons (START SESSION + 3 small chips):

- **Replace `transition-all` with `transition-transform`** -- only animate transform (scale/translate), never background or other properties
- **Add `bg-transparent`** -- explicitly set background to transparent so no browser default can override it

Additionally, in `src/index.css`, add `background-color: transparent !important` to the `button:active` rule to universally prevent browsers from injecting a dark active background.

### Files to Modify

**1. `src/index.css` (lines 19-23)**
Add `background-color: transparent !important;` to the `button:active` rule:
```css
button:active,
[role="button"]:active {
  outline: none;
  background-color: transparent !important;
  -webkit-tap-highlight-color: transparent;
}
```

**2. `src/components/NewSessionButton.tsx` (line 23)**
Change:
- `transition-all` to `transition-transform`
- Add `bg-transparent`

**3. `src/pages/Index.tsx` (lines 165, 175, 185)**
On each of the three small chip buttons:
- `transition-all` to `transition-transform`
- Add `bg-transparent`

### What stays the same
- All sizes, spacing, layout, positioning -- unchanged
- All hover effects -- unchanged (hover:scale-105 still uses transform, so it works with transition-transform)
- All functionality -- unchanged

