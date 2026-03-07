

## Plan: Performance Fixes (AuthContext Parallelization + Start Session Button Immediacy)

### Change 1: Parallelize profile fetches in `src/context/AuthContext.tsx`

**Lines 328-340**: Replace sequential queries with `Promise.all`:

```typescript
// Before (sequential):
const { data, error } = await supabase.from('profiles')...
const { data: privateData } = await supabase.from('user_private_data')...

// After (parallel):
const [profileResult, privateResult] = await Promise.all([
  supabase.from('profiles').select('*').eq('id', supabaseUser.id).single(),
  supabase.from('user_private_data').select('full_name').eq('id', supabaseUser.id).single(),
]);
const { data, error } = profileResult;
const { data: privateData } = privateResult;
```

Everything after line 340 stays exactly the same — same error handling, same merge logic, same flow.

### Change 2: Show Start Session button immediately on Index page

**Problem**: `src/pages/Index.tsx` line 109 blocks the entire page render (including the Start Session button) while `isLoading || isRecovering` is true. The sessions fetch can take 10+ seconds. The Start Session button has zero dependency on session data.

**Fix in `src/pages/Index.tsx`**: Remove the full-page loading gate (lines 109-118). Instead, show the header + Start Session button + chip buttons immediately, and only show a small inline loading spinner in the "Recent Sessions" area while sessions load.

Specifically:
- Delete the early-return loading block (lines 109-118)
- Wrap only the session-dependent sections (StatsQuickView, ActiveSessionsList, Recent Sessions list) in a conditional that shows an inline spinner when `isLoading || isRecovering`
- The header, NewSessionButton, and three chip buttons render instantly

### Change 3: Preload the Start Session image asset

**In `index.html`**: Add a `<link rel="preload">` for the stopwatch PNG so the browser fetches it early, before the JS bundle even evaluates:

```html
<link rel="preload" href="/src/assets/start-session-stopwatch.png" as="image" />
```

(Vite rewrites this to the hashed asset path at build time.)

### Verification approach
- DevTools Network tab: confirm `profiles` and `user_private_data` requests fire simultaneously
- The Start Session button and chip icons should be visible immediately after auth completes, without waiting for session data
- All user flows (login, logout, navigation, session creation) unchanged

