

## Plan: Premium Frame + LED Spotlight Glow for Session Timer

### What changes

**Single file**: `src/components/poker/SessionTimerCard.tsx` — lines 188-205 (the timer frame wrapper)

### Current state
A flat `1.5px solid gold` border with `12px 24px` padding. No depth, no glow.

### New frame design

Replace the inline `style` border with a layered CSS approach:

1. **Frame depth** — Use a double-border technique: an outer container with a ~3px gold/brown gradient border (using `border-image` or nested divs), plus a thin inner border (1px darker gold) to simulate a beveled physical frame edge. Background of the frame strip itself uses a subtle linear gradient from dark brown to medium brown (like the reference clock's wooden frame).

2. **Outward LED glow** — Apply `box-shadow` with multiple layers radiating **outward** from the frame:
   ```
   box-shadow:
     0 0 8px 2px hsla(43, 77%, 52%, 0.25),   /* tight warm glow */
     0 0 20px 4px hsla(43, 77%, 52%, 0.12),   /* medium spread */
     0 0 40px 8px hsla(43, 77%, 52%, 0.06);   /* soft ambient */
   ```
   This creates the "hidden LEDs behind the frame" effect — warm gold light bleeding outward, fading naturally.

3. **Frame structure** — Outer div gets:
   - `border: 3px solid` with a brown-to-gold gradient feel (via `border-color` using a warm brown like `hsl(30, 40%, 28%)`)
   - Inner `outline: 1px solid hsl(43, 60%, 40%)` for the inner bevel line
   - `border-radius: 12px`
   - `padding: 16px 28px`
   - Background inside stays as-is (inherits from parent white card)

### What stays unchanged
- Digit font family, color, text-shadow, stroke, letter-spacing — untouched
- "Session Time" label text — untouched  
- Timer logic, formatTime, all state — untouched
- Everything below the frame (stats grid, buttons, modals) — untouched

### Implementation detail

Replace lines 188-205's frame wrapper with Tailwind classes + a small inline style for the multi-layer box-shadow and border styling. No new files, no new dependencies.

