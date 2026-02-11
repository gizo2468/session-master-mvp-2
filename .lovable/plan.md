

## Fix: Remove Yellow Focus Outline and Fix Chip Hitboxes

### Problem 1: Yellow Outline on Click
The **NewSessionButton** (`src/components/NewSessionButton.tsx`) has `focus:ring-2 focus:ring-offset-2 focus:ring-poker-gold` which shows a gold/yellow rectangular border when the button receives focus. This is the yellow box visible in the screenshot. The three chip buttons may also show browser-default focus outlines despite `focus:outline-none` (some browsers need `focus-visible:outline-none` as well).

### Problem 2: Oversized Clickable Areas
The three chip icon buttons (`src/pages/Index.tsx`, lines 163-187) have:
- `p-2` padding, making the clickable area larger than the visible chip image
- `z-10` stacking, which causes them to intercept clicks on elements underneath (like the stats card or START SESSION button)
- Rectangular hit areas instead of circular ones matching the chip shape

### Fix Plan

#### File 1: `src/components/NewSessionButton.tsx`
- Replace `focus:ring-2 focus:ring-offset-2 focus:ring-poker-gold` with `focus:outline-none focus-visible:outline-none` to completely remove the gold rectangle on click/focus.

#### File 2: `src/pages/Index.tsx` (lines 163-187, the three chip buttons)
For each of the three chip buttons (Player Card, Coach, My Notes):
- Remove `p-2` padding so the clickable area matches the image bounds exactly.
- Add `rounded-full` and `overflow-hidden` to clip the hit area to a circle matching the chip shape.
- Keep `focus:outline-none` and add `focus-visible:outline-none` to prevent any focus outlines.
- Keep all positioning, sizing, transitions, and `z-10` unchanged (needed for layering above the main chip).

### What stays the same
- Button design, size, position, and spacing -- all unchanged
- All functionality (navigation, modals) -- unchanged
- Layout of the START SESSION chip and stats card -- unchanged

