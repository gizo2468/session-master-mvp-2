

## Plan: Move gold frame from card to timer area only

### Change: `src/components/poker/SessionTimerCard.tsx`

1. **Line 187**: Remove the `style={{ border: '1.5px solid hsl(43, 77%, 52%)' }}` from the outer card div.

2. **Lines 188-200**: Wrap the "Session Time" label and digital timer in a new `div` with a thin gold border:

```tsx
<div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
  <div 
    className="inline-block rounded-lg mb-3"
    style={{ 
      border: '1.5px solid hsl(43, 77%, 52%)', 
      padding: '12px 24px' 
    }}
  >
    <div className="mb-2 text-sm text-gray-500">Session Time</div>
    <div 
      className="text-5xl font-bold" 
      style={{ ... existing timer styles ... }}
    >
      {formatTime(elapsedTime)}
    </div>
  </div>
```

The `mb-3` moves from the timer div to the wrapper, and `inline-block` keeps the frame tightly wrapping the content.

### Files changed
- `src/components/poker/SessionTimerCard.tsx` (lines 187-200)

