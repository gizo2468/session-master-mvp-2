
## Investigate Preview White Screen as a Lovable Preview Issue

### What I found
- The current startup files do not show an obvious syntax break from the recent subscription text edits.
- The preview snapshots available right now show:
  - no console errors captured
  - no matching network failures captured
  - session replay with almost no meaningful interaction data
- The auth/bootstrap path is still the main place where the preview can stall:
  - `src/App.tsx`
  - `src/components/auth/AuthGuard.tsx`
  - `src/context/AuthContext.tsx`
- There is also a known Lovable preview-only failure mode where the preview environment interferes with Supabase auth/network requests and produces a white screen even though the published app works.

### Plan
1. Treat this first as a preview-environment problem, not an app bug.
2. Verify whether the published app loads correctly while the preview remains white.
3. Check whether the preview is failing during auth/bootstrap rather than from a code regression.
4. If the published app works, avoid further app-code changes for this issue and use the published URL for functional testing until preview is stable.
5. Only if the published app also fails will I continue with an app-level fix plan.

### Likely root cause
The strongest current signal is:
- preview-specific startup/auth failure
- not a subscription-screen text change
- not enough evidence of a real runtime code crash in the app itself

### Technical details
```text
Possible flow:
Lovable preview loads
-> preview proxy/interceptor affects startup/auth request
-> Auth bootstrap never completes cleanly
-> app appears as white page
```

### Scope
- Focus only on the white preview rendering problem
- Do not change purchase flow, subscription UI, or unrelated navigation unless the published app proves broken too
