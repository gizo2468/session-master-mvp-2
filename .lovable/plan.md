

## Plan: Add Unlit Segments Effect to Timer Digits

### Approach
The classic 7-segment "unlit segments" effect is achieved by rendering a background layer of `8`s (all segments active) in a very faint color, positioned exactly behind the real digits. The DSEG7Classic font already renders proper 7-segment shapes, so displaying `8:88:88` in faint color behind the actual time creates the effect naturally.

### Changes (single file: `src/components/poker/SessionTimerCard.tsx`)

**Lines 205-217** — Wrap the digits in a `relative` container and add an absolutely-positioned "ghost" layer behind them:

```tsx
<div className="relative">
  {/* Unlit segments: full 8s in faint color behind real digits */}
  <div 
    aria-hidden="true"
    className="text-5xl font-bold absolute inset-0"
    style={{ 
      fontFamily: "'DSEG7Classic', monospace",
      color: 'hsla(43, 50%, 70%, 0.18)',
      letterSpacing: '-0.03em',
      paddingRight: '0.03em',
    }}
  >
    {/* Match the format: show 8s for each character, preserve colons */}
    {formatTime(elapsedTime).replace(/[0-9]/g, '8')}
  </div>
  {/* Active (lit) digits — unchanged */}
  <div 
    className="text-5xl font-bold"
    style={{ 
      fontFamily: "'DSEG7Classic', monospace",
      color: 'hsl(43, 77%, 52%)',
      WebkitTextStroke: '0.8px hsl(0, 0%, 75%)',
      textShadow: '0 0 3px hsla(43, 77%, 52%, 0.4)',
      letterSpacing: '-0.03em',
      paddingRight: '0.03em',
    }}
  >
    {formatTime(elapsedTime)}
  </div>
</div>
```

### How it works
- The ghost layer uses the same DSEG7 font at the same size/spacing, but replaces all digit characters with `8` (all 7 segments visible) and renders them in a very low-opacity gold tint (`hsla(43, 50%, 70%, 0.18)`).
- The real digits layer sits on top, so active segments appear bright gold while inactive segments show as faint outlines underneath.
- No `WebkitTextStroke` or `textShadow` on the ghost layer — keeps it subtle.
- `aria-hidden="true"` on the ghost layer for accessibility.

### What stays unchanged
- Timer logic, frame, glow, layout, label, spacing — all untouched.

