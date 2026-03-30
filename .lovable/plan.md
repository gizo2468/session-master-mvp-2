

## Add Gold Neon Glow Behind Chip Area (Dark Mode Only)

### What
Add a subtle, premium yellow/gold radial glow behind the main "Start Session" chip and three smaller chips on the Home screen. Visible only in dark mode.

### How

**Single file change: `src/pages/Index.tsx`**

Inside the chip container div (line 191), add a decorative `<div>` as the first child — positioned absolutely, centered, behind the chips (`z-0`), hidden in light mode:

```tsx
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0
  w-[85%] h-[75%] rounded-full
  hidden dark:block
  bg-[radial-gradient(ellipse_at_center,rgba(218,165,32,0.18)_0%,rgba(218,165,32,0.08)_40%,transparent_70%)]
  blur-2xl pointer-events-none"
/>
```

- `hidden dark:block` — only visible in dark mode
- Warm gold radial gradient (`goldenrod` tones at ~18% opacity center, fading to transparent)
- `blur-2xl` for soft atmospheric spread
- `pointer-events-none` so it never interferes with taps
- `z-0` keeps it behind all chip buttons (`z-10`)

No layout, sizing, or functionality changes.

