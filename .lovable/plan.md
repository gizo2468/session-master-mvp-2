

## Plan: Style Live Session Timer Digits — Gold, Bolder, Sharper

### Change: `src/components/poker/SessionTimerCard.tsx` (line 189)

Update the timer `div` styling:
- Add gold color using the app's poker-gold (`hsl(43, 77%, 52%)`) or `text-yellow-500`
- Add `letter-spacing` for cleaner digit separation
- Add `-webkit-text-stroke` for thicker/bolder segment edges
- Add `text-shadow` with a subtle gold glow for crispness

```tsx
<div 
  className="text-5xl font-bold mb-3" 
  style={{ 
    fontFamily: "'DSEG7Classic', monospace",
    color: 'hsl(43, 77%, 52%)',
    WebkitTextStroke: '1px hsl(43, 77%, 42%)',
    textShadow: '0 0 2px hsla(43, 77%, 52%, 0.3)',
    letterSpacing: '0.05em'
  }}
>
```

### Files changed
- `src/components/poker/SessionTimerCard.tsx` (line 189 only)

