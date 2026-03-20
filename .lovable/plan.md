

## Plan: Fix Home Page Top Safe Area on iPhone

### Root Cause

The Home page outer `<div>` and `<header>` have no top safe-area padding. On iPhones with a notch or Dynamic Island, the system status bar overlaps the header content, making it appear "cut off." The CSS utility `.pt-safe` already exists in `index.css` (`padding-top: env(safe-area-inset-top, 0)`) but is not applied to the Home page.

### Fix

**`src/pages/Index.tsx`** — Add `pt-safe` class to the root `<div>` on line 116:

```tsx
// Before
<div className="min-h-screen bg-gray-50">

// After
<div className="min-h-screen bg-gray-50 pt-safe">
```

This adds `padding-top: env(safe-area-inset-top)` which pushes the header content below the notch/Dynamic Island area. On devices without a notch, the value is 0 so nothing changes.

### Scope
- One line change in `src/pages/Index.tsx`
- No other files affected

