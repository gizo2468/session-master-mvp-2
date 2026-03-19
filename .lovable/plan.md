

## Plan: Add iOS Swipe-Back Gesture

### Approach

Create a reusable `useSwipeBack` hook that detects left-to-right edge swipes (starting within 30px of the left edge) and triggers `navigate(-1)`. Wrap applicable pages with a thin provider component or apply the hook directly in a layout wrapper.

### Hook: `src/hooks/useSwipeBack.ts`

- Listen to `touchstart`, `touchmove`, `touchend` on the page container
- Only activate when touch starts within 30px of the left screen edge
- Track horizontal distance; if swipe > 80px right and mostly horizontal (dx > 2×dy), call `navigate(-1)`
- Only activate on native iOS (check `Capacitor.isNativePlatform()` + iOS user agent) — no-op on web
- Add a subtle visual indicator: a small semi-transparent arrow/gradient on the left edge during swipe (optional, can skip for v1)

### Where to apply

Apply the hook inside `PageContainer.tsx` so all pages using it get swipe-back automatically. Pages that use `PageContainer`:

**Screens that should support swipe-back** (detail/sub-pages that have a "Back" button):
- SessionDetail, EditSession, SessionHistory, Settings, Dashboard, PlayerProfile, CoachProfile, Subscription pages, Notifications, AddPastSession, CoachDashboard, PlayerDashboard, ConnectCoach, Help, PrivacyPolicy

**Screens to exclude** (home/root, auth, live session with active gestures):
- Index (home — no back destination)
- LiveSession (has sliders, horizontal interactions, drag gestures)
- Auth pages (Login, Signup, ForgotPassword, ResetPassword — no meaningful back)

### Implementation

1. **Create `src/hooks/useSwipeBack.ts`** — edge-swipe detection hook using touch events, gated to native iOS only
2. **Update `src/components/ui/PageContainer.tsx`** — call `useSwipeBack()` inside it, attach ref to container div
3. **Ensure LiveSession and Index do NOT use PageContainer** (verify — if they do, add an opt-out prop like `disableSwipeBack`)

### Exclusion safety

The hook only fires on edge swipes (start x < 30px), so it won't conflict with:
- Horizontal scrolling in content areas
- Card carousels or sliders (those start mid-screen)
- Modals/dialogs (rendered in portals above the page)

Single file change for the hook, one small edit to PageContainer. No UI/layout changes.

