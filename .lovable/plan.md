

## Plan: Fix iOS Overscroll Gap on Home Page

### Problem
On iPhone, pulling down on the Home page triggers the iOS rubber-band (overscroll bounce) effect, revealing an empty gap above the page content. The `bg-gray-50` background of the root div doesn't extend into the overscroll area, so the user sees a white/empty strip.

### Fix

**`src/pages/Index.tsx`** — Two changes to the root container:

1. Add `overscroll-none` class (Tailwind for `overscroll-behavior: none`) to prevent the bounce effect entirely on the Home page
2. Add `fixed inset-0 overflow-y-auto` to make the container fill the viewport and manage its own scrolling, which eliminates the body-level overscroll

The root div changes from:
```tsx
<div className="min-h-screen bg-gray-50 pt-safe">
```
to:
```tsx
<div className="fixed inset-0 overflow-y-auto overscroll-none bg-gray-50 pt-safe">
```

This keeps the Home page content scrollable but prevents the iOS rubber-band from exposing empty space above the header. The `fixed inset-0` approach ensures the background color covers the entire viewport including any overscroll area.

### Scope
- One line change in `src/pages/Index.tsx`
- No other files affected

