
# Fix Coach Chip Button (Blank Screen + App Freeze)

## Root Cause
The Coach chip button navigates to `/coach-dashboard` or `/player-dashboard?openConnect=true`, but **neither route is registered** in `App.tsx`. The router has no matching route and no catch-all, so the user sees a blank screen.

The page components exist as files (`CoachDashboard.tsx`, `PlayerDashboard.tsx`, `ConnectCoach.tsx`) but were never added to the route table.

## Fix: Add Missing Routes to App.tsx

Add lazy-loaded imports and route entries for the three missing pages:

```text
New lazy imports:
  - CoachDashboard
  - PlayerDashboard
  - ConnectCoach

New routes:
  /coach-dashboard  ->  CoachDashboard
  /player-dashboard ->  PlayerDashboard
  /connect-coach    ->  ConnectCoach
```

### Specific changes in `src/App.tsx`:

1. Add three new lazy imports (around line 37):
   - `const CoachDashboard = lazyWithRetry(() => import("./pages/CoachDashboard"), "CoachDashboard");`
   - `const PlayerDashboard = lazyWithRetry(() => import("./pages/PlayerDashboard"), "PlayerDashboard");`
   - `const ConnectCoach = lazyWithRetry(() => import("./pages/ConnectCoach"), "ConnectCoach");`

2. Add three new Route entries (around line 88, before the closing `</Routes>`):
   - `<Route path="/coach-dashboard" element={<CoachDashboard />} />`
   - `<Route path="/player-dashboard" element={<PlayerDashboard />} />`
   - `<Route path="/connect-coach" element={<ConnectCoach />} />`

## What This Fixes
- Coach chip with connected coach: navigates to `/coach-dashboard` which now renders properly
- Coach chip without connected coach: navigates to `/player-dashboard?openConnect=true` which now renders and auto-scrolls to the connect section
- The "Manage" and "Connect with a Coach" buttons on PlayerDashboard link to `/connect-coach`, which also now works

## Files Modified
- `src/App.tsx` only -- add imports and routes

## What Stays the Same
- Button design, size, position unchanged
- All existing routes and functionality unchanged
- No database or RLS changes needed
