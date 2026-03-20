

## Enable Swipe-Back on Start New Session Page

### Problem
`src/pages/SessionForm.tsx` does not use `useSwipeBack` — it's the only major page missing the gesture.

### Fix
In `src/pages/SessionForm.tsx`:
1. Import `useSwipeBack` from `@/hooks/useSwipeBack`
2. Call `useSwipeBack({ fallbackPath: '/', screenName: 'SessionForm' })` to get a ref
3. Attach the ref to the root `<div>` (line 343)

Single file, 3-line change.

