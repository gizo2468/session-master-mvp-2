

## Fix: Remove Tap Flash and Shrink START SESSION Chip

### Issue 1: Tap Flash/Outline on Click

The global CSS already sets `-webkit-tap-highlight-color: transparent` on buttons, but a brief rectangular flash still appears. This is caused by:
- The browser applying a default tap highlight on the `img` element inside the button (not covered by the global rule)
- Potential `outline` from the `active` pseudo-state

**Fix in `src/index.css`**: Add `img` to the global tap-highlight rule and add a universal `outline: none` on `:active` for buttons:
```css
button,
[role="button"],
a,
[data-state],
button img {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

button:active,
[role="button"]:active {
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
```

Also add `-webkit-tap-highlight-color: transparent` directly as inline styles on the chip buttons in `src/pages/Index.tsx` and `src/components/NewSessionButton.tsx` as a belt-and-suspenders approach (some iOS WebViews ignore the CSS rule).

### Issue 2: Shrink START SESSION Chip + Constrain Hitbox

Currently the START SESSION image is `w-[28rem] sm:w-[32rem]` (448px / 512px) which is very large and its rectangular button area intercepts clicks.

**Fix in `src/components/NewSessionButton.tsx`**:
- Reduce image size from `w-[28rem] sm:w-[32rem]` to `w-72 sm:w-80` (288px / 320px) -- roughly 35% smaller
- Add `rounded-full overflow-hidden` to the button so the clickable area is clipped to the circular chip shape (same technique used on the smaller chips)

### Files to Modify

1. **`src/index.css`** (lines 7-14): Expand the tap-highlight rule to cover images inside buttons and add `:active` outline suppression.

2. **`src/components/NewSessionButton.tsx`** (lines 21-31):
   - Add `rounded-full overflow-hidden` to button className
   - Add inline `style={{ WebkitTapHighlightColor: 'transparent' }}`
   - Reduce image from `w-[28rem] sm:w-[32rem]` to `w-72 sm:w-80`

3. **`src/pages/Index.tsx`** (lines 163-187): Add inline `style={{ WebkitTapHighlightColor: 'transparent' }}` to each of the three chip buttons for extra safety.

### What stays the same
- Small chip positions, sizes, and spacing -- unchanged
- All functionality and navigation -- unchanged
- Stats card positioning -- unchanged (the `-mt-28` pull-up may need minor visual tweaking but layout logic stays)

