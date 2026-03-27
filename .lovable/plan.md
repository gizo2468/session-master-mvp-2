

## Fix Back Buttons to Use Explicit Parent Routes

### Problem
Several screens use `navigate(-1)` (history-based back) instead of navigating to their known parent. This causes loops: Home → Dashboard → Coach Profile → Back (to Dashboard) → Back (loops to Coach Profile instead of Home).

### Root Cause
The `useNavigateWithRefresh` hook's `navigateToHomeWithRefresh` function uses `navigate(-1)` when history exists, instead of always going to `/`. Dashboard uses this hook. Other pages (`CoachDashboard`, `PlayerDashboard`, `ConnectCoach`, `Notifications`) also use `navigate(-1)` or `window.history.length > 1` checks.

### Hierarchy Map
```text
Home (/)
├── Dashboard (/dashboard)           → Back = /
│   ├── Coach Profile (/coach/:id)   → Back = /dashboard  ✅ already correct
│   └── Player Profile (/player/:id) → Back = /dashboard  ✅ already correct
├── Coach Dashboard (/coach-dashboard) → Back = /
│   └── Student Detail               → Back = /coach-dashboard  ✅ already correct
├── Player Dashboard (/player-dashboard) → Back = /
├── Connect Coach (/connect-coach)   → Back = /
├── Notifications                    → Back = /
├── Settings (/settings)             → Back = /  (separate fix already done)
└── Subscription                     → Back = /settings  ✅ already fixed
```

### Changes

**1. `src/hooks/useNavigateWithRefresh.ts`** — Change `navigateToHomeWithRefresh` to always navigate to `'/'` with `replace: true` instead of using `navigate(-1)`. This is the core fix — Dashboard uses this hook.

Before:
```typescript
const historyIndex = window.history.state?.idx;
if (typeof historyIndex === 'number' && historyIndex > 0) {
  navigate(-1);
} else {
  navigate('/', { replace: true });
}
```
After:
```typescript
navigate('/', { replace: true });
```
Apply in both the try and catch blocks (lines 27-32 and 35-40).

**2. `src/pages/CoachDashboard.tsx`** (line 105) — Change:
```typescript
onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/', { replace: true })}
```
To:
```typescript
onClick={() => navigate('/', { replace: true })}
```

**3. `src/pages/PlayerDashboard.tsx`** (line 65) — Same change as above.

**4. `src/pages/ConnectCoach.tsx`** (line 75) — Same change as above.

**5. `src/pages/Notifications.tsx`** (line 432) — Same change as above.

### What stays the same
- CoachProfile → `/dashboard` ✅
- PlayerProfile → `/dashboard` ✅
- CoachStudentDetail → `/coach-dashboard` ✅
- CoachSessionReview → `/coach/student/:id` ✅
- Swipe-back gesture keeps its history-based behavior (intentional for native feel)
- Legal pages, SessionForm, etc. keep `navigate(-1)` since they can be entered from multiple parents

### Summary
6 code locations across 5 files. All changes replace `navigate(-1)` with explicit `navigate('/', { replace: true })` for screens whose parent is always Home.

