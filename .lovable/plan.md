

## Plan: Fix View All Button Bottom Spacing

### Problem
The Home page root container is `fixed inset-0` with no bottom padding. On iPhone, the View All button at the bottom of the session list gets cut off by the home indicator bar / bottom safe area.

### Fix

**`src/pages/Index.tsx`** — Add `pb-safe` class to the root div (line 319) to add bottom safe-area padding, plus a small extra bottom padding on the content area:

1. Add `pb-safe` to the root container so the scrollable area respects the bottom safe area inset
2. Add `pb-6` to the `<main>` element (line 285 area) to ensure extra breathing room above the safe area

Root div changes from:
```tsx
<div className="fixed inset-0 overflow-y-auto overscroll-none bg-gray-50 pt-safe">
```
to:
```tsx
<div className="fixed inset-0 overflow-y-auto overscroll-none bg-gray-50 pt-safe pb-safe">
```

And the `<main>` closing area — add `pb-6` to the main's inner content wrapper to give the View All button proper spacing from the bottom edge.

### Scope
- One class addition in `src/pages/Index.tsx`

