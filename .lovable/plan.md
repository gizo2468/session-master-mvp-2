

## Fix: Pixel-Perfect Circular Hitboxes for Home Chip Icons

### Root Cause

`rounded-full overflow-hidden` on the `<button>` elements only affects **visual clipping** — it rounds the corners and hides overflow visually. However, the browser still registers clicks/taps across the entire **rectangular bounding box** of the button. This is standard HTML/CSS behavior.

### Solution

Use `clip-path: circle(50%)` on each chip button via an inline style. Unlike `overflow-hidden`, `clip-path` actually removes the clipped areas from hit-testing — the browser will not register pointer events outside the circle.

Additionally, make each button a perfect square (since `clip-path: circle(50%)` creates a circle from the element's center, it works best on square elements). The chip images are `w-28` wide, so adding `w-28 h-28` ensures a square bounding box, and `clip-path: circle(50%)` then creates a perfect circle matching the visible chip area.

### Changes

**File: `src/pages/Index.tsx`** — All 3 chip buttons (lines 163-187)

For each of the three `<button>` elements:

1. Add inline style: `style={{ clipPath: 'circle(50%)' }}`
2. Add explicit square dimensions: `w-28 h-28` (matching the image width)
3. Keep `rounded-full overflow-hidden` as visual fallback (harmless)
4. Keep all positioning classes (`absolute`, `bottom-[24%]`, etc.) unchanged

Example for the left chip button:
```
<button
  onClick={() => setPlayerCardOpen(true)}
  className="absolute bottom-[24%] left-[5%] z-10 w-28 h-28 rounded-full overflow-hidden ..."
  style={{ clipPath: 'circle(50%)' }}
  aria-label="Player Card"
>
  <img ... className="w-full h-full object-contain pointer-events-none" />
</button>
```

The same pattern applies to all three buttons (Player Card, Coach, My Notes).

### Why This Works

- `clip-path: circle(50%)` is supported in all modern browsers (Chrome, Safari, Firefox, Edge) and mobile WebViews
- It clips both rendering AND pointer/hit-testing to the circle
- No JavaScript hit-testing needed — pure CSS solution
- No layout or visual changes

### No Other Changes

- START SESSION button remains unchanged
- All positions, spacing, and z-indexes stay the same
- Only the 3 small chip buttons are modified

