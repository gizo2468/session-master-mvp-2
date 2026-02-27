

## Plan: Digital Segment Font for Live Session Timer

### Changes

**1. Add DS-Digital font via Google Fonts / CDN**
- Add `@import` or `@font-face` for a segment-style font in `src/index.css`. Since DS-Digital is not on Google Fonts, I'll use a CSS `@font-face` with a free web-safe alternative approach: use the Google Font **"Share Tech Mono"** or embed a segment-style font. Best option: use **Orbitron** from Google Fonts (available, segment-like) or add a `@font-face` with a CDN-hosted DS-Digital.

Actually, the cleanest approach: add a `@font-face` declaration pointing to a free segment LCD font CDN, or use the npm-available approach. Let me use **"Segment7Standard"** or simply apply Orbitron (Google Fonts, very close to segmented look) as a pragmatic choice.

Better: I'll add a `@font-face` for "DSEG7 Classic" — a well-known open-source 7-segment display font available from a CDN (`cdn.jsdelivr.net` hosts it via the `dseg` npm package).

**`src/index.css`** — Add at top:
```css
@font-face {
  font-family: 'DSEG7Classic';
  src: url('https://cdn.jsdelivr.net/npm/dseg@0.46.0/fonts/DSEG7-Classic/DSEG7Classic-Bold.woff2') format('woff2');
  font-weight: bold;
  font-style: normal;
}
```

**2. `src/components/poker/SessionTimerCard.tsx`** (line 189)
- Change the timer `div` className from `text-5xl font-mono font-bold` to use the DSEG7 font family:
```tsx
<div className="text-5xl font-bold mb-3" style={{ fontFamily: "'DSEG7Classic', monospace" }}>{formatTime(elapsedTime)}</div>
```

### Files changed
- `src/index.css` (add `@font-face`)
- `src/components/poker/SessionTimerCard.tsx` (line 189, timer digit styling)

