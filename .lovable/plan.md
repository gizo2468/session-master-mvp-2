

## Fix: Remove remaining top gap on content-safe pages (no white header bar)

### Root Cause

Pages using `content-safe` have this structure:
```html
<div class="min-h-screen content-safe">           <!-- padding-top: env(safe-area-inset-top) ~47px -->
  <div class="container mx-auto max-w-md px-4 pt-4 pb-8">  <!-- +16px extra -->
```

The `content-safe` class correctly applies the iPhone hardware inset (~47px). But the inner container **also** adds `pt-4` (16px), creating ~63px of empty gray space above the back button. On header-bar pages this isn't visible because the white header background absorbs the padding visually — but on content-safe pages with no white header, it shows as a blank gray strip.

### Fix

Remove `pt-4` from the inner container div on all content-safe pages. The hardware safe-area inset from `content-safe` alone is sufficient. The back button and header content will sit flush against the safe area boundary.

### Files to update (10 files, same 1-word change each)

All changes are identical: remove `pt-4` from the inner container `<div>` class.

1. **`src/components/ui/PageContainer.tsx`** — line 26: `px-4 pt-4 pb-8` → `px-4 pb-8`
2. **`src/pages/Settings.tsx`** — line 263: same change
3. **`src/pages/SessionForm.tsx`** — line 344: same change
4. **`src/pages/SessionDetail.tsx`** — line 339: same change
5. **`src/pages/ConnectCoach.tsx`** — line 72: same change
6. **`src/pages/CoachDashboard.tsx`** — line 102: same change
7. **`src/pages/CoachUpgrade.tsx`** — line 67: same change
8. **`src/pages/PlayerDashboard.tsx`** — line 62: same change
9. **`src/pages/CoachStudentDetail.tsx`** — line 36: same change
10. **`src/pages/AddPastSession.tsx`** — line 15: remove `pt-4` from the class string

### Result
- Back button / first content sits flush against the iPhone safe area
- No empty gray strip above the content
- Header-bar pages (Home, Dashboard, etc.) remain unaffected — they use `header-safe` on a white `<header>` element

