
## Fix: Constrain START SESSION Chip Hitbox to Circular Bounds

### Root Cause

The button sizes itself to the image's natural dimensions via `w-[28rem] h-auto`, resulting in a rectangular element. While `rounded-full overflow-hidden` visually clips to an ellipse/circle, the **clickable area remains the full rectangle**. This means taps in the transparent corners of the image still trigger navigation.

### Fix

Make the button a fixed square (same width and height) so that `rounded-full` produces a true circle, and the rectangular hit area matches the visible chip bounds exactly.

**In `src/components/NewSessionButton.tsx`:**

1. Set explicit square dimensions on the button: `w-[28rem] h-[28rem] sm:w-[32rem] sm:h-[32rem]`
2. Keep `rounded-full overflow-hidden` -- now this clips both visuals AND hit area to a circle
3. Make the image fill the button using absolute positioning and `object-cover` so the chip visual stays identical
4. Add `pointer-events-none` to the image so clicks only register on the button's circular area

```tsx
<button
  onClick={handleClick}
  className="relative w-[28rem] h-[28rem] sm:w-[32rem] sm:h-[32rem] rounded-full overflow-hidden bg-transparent transform transition-transform hover:scale-105 hover:-translate-y-1 focus:outline-none focus-visible:outline-none"
  style={{ WebkitTapHighlightColor: 'transparent' }}
  aria-label="New session"
>
  <img 
    src={newSessionIcon} 
    alt="Start Session" 
    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    draggable={false}
  />
</button>
```

### What stays the same
- Visual size and appearance of the chip -- unchanged
- Positioning and layout within the page -- unchanged
- All other chips (Player Card, Coach, My Notes) -- unchanged
- Navigation and functionality -- unchanged

### File Modified
- **`src/components/NewSessionButton.tsx`** -- button gets explicit square dimensions; image becomes absolutely positioned inside it
