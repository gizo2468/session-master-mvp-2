

## Fix: Coach Chip Button (Blank Screen and App Freeze)

### Root Cause

The Coach chip button on the Home screen has a broken navigation flow:

1. **Wrong destination for students WITH coaches**: When a student (player) has connected coaches, tapping the chip navigates to `/coach-dashboard`. But `CoachDashboard` checks if the user has the "coach" role -- since a student is NOT a coach, it redirects to `/coach-profile`, a route that does NOT exist in the app. This causes a blank screen (404/NotFound).

2. **Potential freeze**: The `navigate()` call inside `CoachDashboard` is called during render (not inside a `useEffect`), which can cause React rendering issues and infinite re-render loops in some cases.

### Fix Plan

#### 1. Fix the Coach chip navigation logic in `src/pages/Index.tsx`

Update `handleCoachChipClick` to navigate students to the **Player Dashboard** (where they can see their coaches), not the Coach Dashboard (which is for users with the "coach" role):

- **Has connected coaches** --> Navigate to `/player-dashboard` (shows their coaches list)
- **No connected coaches** --> Navigate to `/player-dashboard?openConnect=true` (scrolls to connect section)

This makes the chip always go to the Player Dashboard for regular players, which is the correct destination.

#### 2. Fix the unsafe redirect in `src/pages/CoachDashboard.tsx`

Move the `navigate('/coach-profile')` call out of the render body and into a `useEffect`, and redirect to a valid route (e.g., `/player-dashboard` or `/`) instead of the non-existent `/coach-profile`. This prevents:
- Navigation to a missing route
- Potential infinite render loops from calling `navigate` during render

#### 3. No other changes

- Button design, size, and position remain untouched
- No changes to any other pages or components

### Technical Details

**File: `src/pages/Index.tsx`** (line ~50-56)
- Change `handleCoachChipClick`: always navigate to `/player-dashboard`, appending `?openConnect=true` only when no coaches are connected.

**File: `src/pages/CoachDashboard.tsx`** (lines 32-41)
- Wrap the non-coach redirect in a `useEffect` hook
- Change redirect target from `/coach-profile` to `/player-dashboard` (a valid route)
- Return a skeleton/loading screen while redirect is pending

