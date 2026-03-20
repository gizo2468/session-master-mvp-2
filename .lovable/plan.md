

## Plan: Global Fix for iPhone Top Gap / Safe-Area Issue

### Problem

The app has an inconsistent container strategy across pages. Three pages (Index, SessionDetail, SessionForm) use `fixed inset-0 overflow-y-auto overscroll-none pt-safe pb-safe`, while ~15+ other pages use `min-h-screen bg-gray-50` without safe-area padding. The PageContainer component also uses `min-h-screen`. This causes:

1. Pages without `pt-safe` show no safe-area padding on iPhone (notch gap missing or wrong)
2. When navigating between fixed-positioned and flow-positioned pages, the document scroll offset leaks, creating a phantom top gap
3. Returning to Home after visiting a non-fixed page can reintroduce the gap

### Solution: Global Layout Wrapper

Instead of fixing each page individually, create a **global layout wrapper** in `App.tsx` that:
- Uses `fixed inset-0 overflow-y-auto overscroll-none pt-safe pb-safe bg-gray-50` on a container wrapping all routes
- Resets scroll position to 0 on every route change

Then **remove** the per-page fixed/safe-area classes from the three pages that already have them (Index, SessionDetail, SessionForm) to avoid double-nesting.

### Changes

**1. Create `src/components/AppLayout.tsx`** — a global layout wrapper

- Wraps `children` in `<div className="fixed inset-0 overflow-y-auto overscroll-none bg-gray-50 pt-safe pb-safe">`
- Uses `useLocation` to listen for route changes and reset `scrollTop = 0` on the wrapper div on every navigation
- This ensures every page automatically gets correct safe-area padding and no scroll leaks

**2. Update `src/App.tsx`**

- Wrap the `<Routes>` block inside `<AppLayout>...</AppLayout>`

**3. Update `src/pages/Index.tsx`** (line 116)

- Change `fixed inset-0 overflow-y-auto overscroll-none bg-gray-50 pt-safe pb-safe` → `min-h-screen` (the global wrapper now handles it)

**4. Update `src/pages/SessionForm.tsx`** (line 343)

- Same change: remove `fixed inset-0 overflow-y-auto overscroll-none pt-safe pb-safe`, use simple `min-h-screen`

**5. Update `src/pages/SessionDetail.tsx`** (line 338)

- Same change: remove `fixed inset-0 overflow-y-auto overscroll-none pt-safe`, use simple `min-h-screen`

**6. Update `src/components/ui/PageContainer.tsx`** (line 26)

- Remove `min-h-screen bg-gray-50` since the global wrapper provides it. Keep just the inner content div.

**7. Update `src/App.css`** (line 3)

- Change `#root` from `min-height: 100vh` to `height: 100%` to not fight with the fixed wrapper

### Why This Works

- Every page inherits the same `fixed inset-0` viewport lock + `pt-safe pb-safe` from one place
- Scroll position resets on navigation via the wrapper's `scrollTop = 0`, preventing leaked offsets
- No page-by-page fixes needed going forward
- Back navigation and swipe-back both land on correctly positioned pages

### Scope
- 1 new file (`AppLayout.tsx`)
- 6 small edits to existing files
- No visual or layout changes beyond fixing the gap

