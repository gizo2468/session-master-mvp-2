

## Plan: Subtly lighten timer digit color

### Single change in `src/components/poker/SessionTimerCard.tsx`

Adjust three HSL color values on lines 230-232 to shift the digits from the current mustard tone toward a lighter bright gold:

| Property | Current | New |
|---|---|---|
| `color` (line 230) | `hsl(40, 85%, 42%)` | `hsl(43, 80%, 48%)` |
| `WebkitTextStroke` (line 231) | `hsl(43, 80%, 50%)` | `hsl(45, 78%, 55%)` |
| `textShadow` glow (line 232) | `hsla(43, 90%, 50%, 0.5)` / `hsla(43, 90%, 55%, 0.3)` | `hsla(45, 85%, 55%, 0.5)` / `hsla(45, 85%, 58%, 0.3)` |

This raises lightness by ~6% and shifts hue slightly warmer (40→43→45), producing a softer golden yellow without changing the glow intensity, stroke width, font, spacing, or layout.

