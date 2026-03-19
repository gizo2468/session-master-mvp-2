

## Plan: Add Smooth Visual Slide Transition to Swipe-Back

### Problem
The swipe-back gesture works functionally but has no visual feedback — the page just abruptly changes on `navigate(-1)`. It needs to visually slide the page right as the user drags, then either complete the slide-out animation or snap back.

### Approach
Enhance `useSwipeBack` to visually translate the page container in real-time during the swipe, with:
- **Live tracking**: During `touchmove`, apply `transform: translateX(dx)` to the element with decreasing opacity
- **A subtle shadow** on the left edge during the drag to simulate depth
- **Completion animation**: If the swipe qualifies, animate the page fully off-screen (translateX → 100%) over ~250ms, then navigate
- **Snap-back animation**: If the swipe is cancelled or too short, animate smoothly back to translateX(0) over ~200ms
- Use `will-change: transform` and GPU-accelerated properties only

### Changes

**`src/hooks/useSwipeBack.ts`** — Add visual feedback to the existing gesture logic:

1. **`touchstart`**: Set `will-change: transform` on the element, remove any existing transition
2. **`touchmove`**: Apply `transform: translateX(${dx}px)` directly to the element (clamped to 0–screenWidth). Add slight opacity reduction (1 → 0.85 as dx grows). Add a left-edge shadow via `boxShadow`
3. **`touchend` (qualifies)**: Add a CSS transition (`transform 250ms ease-out, opacity 200ms ease-out`), set `translateX(100vw)` + opacity 0, then after the transition ends call `navigate(-1)` or fallback
4. **`touchend` (doesn't qualify) / `touchcancel`**: Add transition, animate back to `translateX(0)` + opacity 1, then clean up styles
5. **Cleanup**: Always remove inline styles and `will-change` after animation completes

No new files needed. No changes to page components or routing. The visual effect is entirely self-contained in the hook via inline style manipulation on the ref'd element.

### Technical details

- Use `requestAnimationFrame` in touchmove for smooth 60fps updates
- Use `transitionend` listener for cleanup after completion/snap-back animations
- Clamp translateX to prevent negative (leftward) movement
- Opacity range: 1.0 → 0.85 (subtle, not dramatic)
- Shadow: `box-shadow: -4px 0 16px rgba(0,0,0,0.15)` during drag

