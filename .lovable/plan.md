

## Fix: Coach Chip Button - Role-Based Navigation

### Current Problem
The Coach chip always navigates to `/player-dashboard`, which is a separate page with limited functionality. The screenshot shows the desired behavior is actually the **Dashboard page** (`/dashboard`) with the `MyCoachingNetwork` component, where the "Connect to Coach" dialog can open automatically.

### Plan

#### 1. Player with NO coach -- Navigate to Dashboard with auto-open Connect dialog

- **`src/pages/Index.tsx`**: Change `handleCoachChipClick` to navigate to `/dashboard?openConnect=true` instead of `/player-dashboard?openConnect=true`.
- **`src/components/coaching/MyCoachingNetwork.tsx`**: Add a new prop `autoOpenConnect?: boolean`. When `true`, auto-open the `connectDialogOpen` state on mount (for students) so the "Connect to Coach" dialog appears immediately.
- **`src/pages/Dashboard.tsx`**: Read the `openConnect` query param from the URL and pass it as `autoOpenConnect` to `MyCoachingNetwork`.

This matches the screenshot exactly -- Dashboard page with the "Connect to Coach" popup.

#### 2. Player WITH connected coach(es) -- Navigate to most relevant coach profile

- **`src/pages/Index.tsx`**: When `connectedCoaches.length > 0`, navigate directly to `/coach/{coachId}` using the first connected coach (the most relevant one). Since the `connectedCoaches` array from `CoachStudentContext` doesn't track "most recent interaction," we use the first coach in the list (or the only one if there's just one).

#### 3. Coach tapping the chip -- Show connected players modal

- **`src/pages/Index.tsx`**: Add a state `showPlayersModal` and a new `Dialog` component. When the user `isCoach`, tapping the chip opens this modal instead of navigating. The modal shows a list of connected students (from `useCoachStudent().students`). Tapping a player navigates to `/player/{playerId}`. If no students are connected, show a message.
- The coach role is detected via `useCoachStudent().isCoach`.

### Technical Details

**Files to modify:**

1. **`src/pages/Index.tsx`**
   - Import `isCoach`, `students` from `useCoachStudent()`
   - Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from UI
   - Add `showPlayersModal` state
   - Update `handleCoachChipClick`:
     - If `isCoach`: set `showPlayersModal(true)`
     - Else if `connectedCoaches.length > 0`: navigate to `/coach/${connectedCoaches[0].id}`
     - Else: navigate to `/dashboard?openConnect=true`
   - Add Dialog JSX for coach's player list modal

2. **`src/components/coaching/MyCoachingNetwork.tsx`**
   - Add `autoOpenConnect?: boolean` prop
   - In `useEffect`, if `autoOpenConnect` is true and user is a student, set `connectDialogOpen(true)`

3. **`src/pages/Dashboard.tsx`**
   - Read `openConnect` from `useSearchParams`
   - Pass `autoOpenConnect={openConnect === 'true'}` to `MyCoachingNetwork`

No new routes, no layout changes, no button design changes.
