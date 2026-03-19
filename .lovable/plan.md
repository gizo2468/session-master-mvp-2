

## Plan: Fix Home Page Scroll Position on Open/Return

### Root Cause

The Home page (`Index.tsx`) never scrolls to the top on mount or when the user returns to it. Other pages like `LiveSession` and `Subscription` explicitly call `window.scrollTo(0, 0)` on mount, but the Home page does not.

When navigating back to Home (via swipe-back or button), the browser may retain a stale scroll offset from the previous visit or from the route transition animation, causing the page to appear slightly scrolled down. The `-mt-36` negative margin on the chip container makes even a small offset visually obvious, since it cuts off the top of the header area.

### Fix

Add a `useEffect` in `src/pages/Index.tsx` that scrolls to the true top on mount:

```ts
useEffect(() => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}, []);
```

This matches the same pattern already used in `LiveSession.tsx` (line 33) and `Subscription.tsx` (line 64).

### Scope
- **One file changed**: `src/pages/Index.tsx` — add the scroll-to-top effect
- No layout, spacing, or navigation changes

