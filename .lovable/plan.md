

## Plan: Fix Start New Session Top Gap & Back Navigation

### Problem
`SessionForm.tsx` uses `min-h-screen bg-gray-50` without safe-area padding or fixed positioning. When navigating between this page and the Home page (which uses `fixed inset-0`), the inconsistent container strategies cause scroll-offset issues that persist after navigating back.

### Fix

**`src/pages/SessionForm.tsx`** — line 343, update the root div:

```tsx
// Before
<div className="min-h-screen bg-gray-50">

// After
<div className="fixed inset-0 overflow-y-auto overscroll-none bg-gray-50 pt-safe pb-safe">
```

This matches the same pattern used on the Home page and SessionDetail, ensuring:
- Correct top positioning with `pt-safe` for iPhone notch/Dynamic Island
- Bottom safe area with `pb-safe`
- No scroll offset leaking between pages via `fixed inset-0 overflow-y-auto overscroll-none`

### Scope
- One line change in `src/pages/SessionForm.tsx`

