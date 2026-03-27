
## Investigate Why the Preview Is Failing

### What I found so far
- The recent `Subscription.tsx` edits look syntactically valid.
- No browser console errors were captured from the preview snapshot.
- The preview session replay shows the page shell loading, but that alone does not prove the React app fully initialized.
- The startup path is gated by:
  - `src/App.tsx`
  - `src/components/auth/AuthGuard.tsx`
  - `src/context/AuthContext.tsx`

### Most likely causes to verify
1. A startup/runtime issue during app bootstrap or auth initialization
2. A preview-only environment problem rather than a real app regression
3. A stale route/history/session state causing the preview iframe to fail before rendering the page

### Fix plan
1. Inspect the app startup flow and auth guard path end-to-end to identify where rendering stops.
2. Check preview-side request failures and runtime logs for the initial load/auth flow, not just the subscription page.
3. If a code regression is found, make the smallest targeted fix in the startup/auth/render path.
4. If this is confirmed to be preview-only, avoid unnecessary app changes and verify behavior against the published app instead of chasing the preview environment.

### Files already identified as highest priority
- `src/App.tsx`
- `src/components/auth/AuthGuard.tsx`
- `src/context/AuthContext.tsx`
- `src/pages/Subscription.tsx`

### Implementation constraints
- Do not change pricing, purchases, or unrelated UI
- Only fix the actual cause of the failed preview/render path
- Avoid speculative changes if the issue is platform-specific to preview

### Technical note
There is a known class of preview-only failures where the preview environment interferes with auth/network calls even though the published app works. I will first separate “real app bug” from “preview-only issue” before proposing any code change, so you do not lose more messages on blind fixes.
