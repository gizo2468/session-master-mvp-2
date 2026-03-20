

## Problem

Every "Back" / "Home" button across the app uses `navigate('/')` or `navigateToHomeWithRefresh()` which calls `navigate('/')`. This **pushes** a new `/` entry onto the browser history stack instead of going back. 

So a flow like: Home → Settings → (Back) → Home → Dashboard → (Back) → Home creates history: `[/, /settings, /, /dashboard, /]`. When the user swipe-backs, they walk through all those stale entries — Settings, Home, Dashboard, Home — instead of just going one step back.

The same issue applies to `navigate('/')` calls in ~13 other page files.

## Fix

Two-part solution:

### 1. Fix `useNavigateWithRefresh` to use `navigate(-1)` with a `/` fallback

Change `navigateToHomeWithRefresh` so it pops history instead of pushing. If there's no history to go back to (e.g. deep link), fall back to `navigate('/', { replace: true })`.

This single change fixes Settings, Dashboard, SessionHistory, SimpleSettings, LiveSessionHeader, and SessionDetailHeader — all places that use `navigateToHomeWithRefresh` as their back button.

### 2. Fix direct `navigate('/')` calls on back buttons

For pages that use `navigate('/')` directly as their "back" action (not as a redirect after completing an action), change them to `navigate(-1)` with awareness of history depth.

Pages with back-button `navigate('/')` to fix:
- `ConnectCoach.tsx` — back button
- `PlayerDashboard.tsx` — back button  
- `CoachDashboard.tsx` — back button
- `Notifications.tsx` — back button
- `AddPastSession.tsx` — close/back handler

Pages where `navigate('/')` is correct and should NOT change (these are "go to home after completing an action" — the user expects to land on home, not go back to the form):
- `SessionDetail.tsx` — after ending/deleting session
- `ConfirmSession.tsx` — after confirming session
- `EditSession.tsx` — after saving edits
- `LiveSession.tsx` — error/fallback states
- `Settings.tsx` — after logout
- `auth/Signup.tsx` — after signup
- `CoachUpgrade.tsx` — redirect guard

### 3. For action-completion navigations, use `replace: true`

The `navigate('/')` calls that happen after completing actions (end session, delete, save, confirm) should use `{ replace: true }` so they don't add the completed form page to history.

### Files to update

1. **`src/hooks/useNavigateWithRefresh.ts`** — change `navigate('/')` to `navigate(-1)` with fallback
2. **`src/pages/ConnectCoach.tsx`** — back button: `navigate(-1)`
3. **`src/pages/PlayerDashboard.tsx`** — back button: `navigate(-1)`
4. **`src/pages/CoachDashboard.tsx`** — back button: `navigate(-1)`
5. **`src/pages/Notifications.tsx`** — back button: `navigate(-1)`
6. **`src/pages/AddPastSession.tsx`** — close handler: `navigate(-1)`
7. **`src/pages/SessionDetail.tsx`** — end/delete actions: add `{ replace: true }`
8. **`src/pages/ConfirmSession.tsx`** — confirm action: add `{ replace: true }`
9. **`src/pages/EditSession.tsx`** — save/back actions: add `{ replace: true }` on completions, `navigate(-1)` on back button

