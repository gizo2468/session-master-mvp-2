

## Plan: Fix Session Summary Top Safe Area

### Problem
The Session Summary page (`SessionDetail.tsx`) root container uses `min-h-screen bg-gray-50` without `pt-safe`, so on iPhone the content renders under the notch/status bar. The "Back" button appears misaligned as shown in the screenshot.

### Fix

**`src/pages/SessionDetail.tsx`** — line 338, update the root div classes:

```tsx
// Before
<div ref={swipeBackRef} className="min-h-screen bg-gray-50">

// After
<div ref={swipeBackRef} className="fixed inset-0 overflow-y-auto overscroll-none bg-gray-50 pt-safe">
```

This matches the same pattern applied to the Home page: fixed viewport container with safe-area top padding and no overscroll bounce.

### Scope
- One line change in `src/pages/SessionDetail.tsx`

