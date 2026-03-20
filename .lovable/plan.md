
Root cause identified: the current “global fix” moved `pt-safe` onto the outer `AppLayout` wrapper:

```tsx
<div className="fixed inset-0 overflow-y-auto overscroll-none bg-gray-50 pt-safe pb-safe">
```

That makes the safe-area render as a blank band above every page. Then many screens add their own top spacing on top of that (`py-8`, `mb-8`, white header bars with `py-4`), so the iPhone top inset is being applied in the wrong place and visually doubled. That is why Home, Start New Session, coach/profile flows, and return navigation all still show the same empty top strip.

Plan to fix it properly and globally:

1. Update the global layout strategy
- Remove `pt-safe` from `AppLayout`
- Keep the fixed viewport/scroll reset behavior there
- Keep bottom safe-area handling globally (`pb-safe`) if needed

2. Move top safe-area handling to shared layout patterns instead of the outer wrapper
- Create reusable top-safe utilities/classes in `src/index.css`, for example:
  - a header-safe class for full-width top bars
  - a content-safe class for standard page containers
- These classes will use `calc(env(safe-area-inset-top, 0px) + ...)` so the safe inset becomes part of the header/content padding instead of a separate blank strip above it

3. Apply the shared pattern to the two main page structures used across the app
- Pattern A: full-width header bar pages  
  Examples found: Home, Dashboard, Notifications, EditSession, ConfirmSession
- Pattern B: standard container pages with back button/content start  
  Examples found: SessionForm, Settings, SessionDetail, ConnectCoach, CoachProfile via `PageContainer`, legal pages, etc.

4. Centralize the standard container fix
- Update `PageContainer` so it becomes the canonical safe-area-aware wrapper for “content pages”
- Replace its generic `py-8` behavior with a top-safe-aware padding pattern
- This will automatically fix the large set of pages already using `PageContainer`

5. Normalize the remaining non-PageContainer pages to the same shared classes
- For pages that render their own top bars, swap raw `py-4` / `py-8` spacing for the shared safe-area classes
- This is still a pattern-based fix, not one-off tweaking

6. Preserve current navigation behavior
- Keep the existing scroll-reset logic in `AppLayout`
- Do not reintroduce per-page fixed wrappers or extra top safe padding, since that caused the stacking/gap issues before

Expected result
- No blank band above the top bar/header
- The header/background reaches the iPhone top area cleanly
- Standard content pages start at the correct safe position without oversized top space
- Returning Home or using swipe-back no longer reintroduces the gap, because the spacing is no longer applied at the wrong global level

Files I would update
- `src/components/AppLayout.tsx`
- `src/index.css`
- `src/components/ui/PageContainer.tsx`
- Shared header/content pages that currently use the two affected layout patterns, starting with:
  - `src/pages/Index.tsx`
  - `src/pages/SessionForm.tsx`
  - `src/pages/Settings.tsx`
  - `src/pages/SessionDetail.tsx`
  - `src/pages/Dashboard.tsx`
  - `src/pages/Notifications.tsx`
  - other pages matching the same header/container patterns

Implementation intent
- This will be a real root-cause fix: remove top safe-area from the outer app shell, and reapply it once per page structure in the correct visual layer.
- No unrelated UI redesigns; only top safe-area/top-spacing behavior will be adjusted.
