1. Update the Start New Session Back button to use a safe navigation rule instead of raw `navigate(-1)`.
   - In `src/pages/SessionForm.tsx`, replace the current inline back handler with logic that checks React Router history (`window.history.state?.idx`).
   - If there is a valid in-app history entry, go back once.
   - If there is no valid history entry, or the page was opened directly / via redirect / after auth, navigate explicitly to Home (`'/'`) with `replace: true`.
   - This matches the project’s existing safe-navigation pattern and prevents the current “tap Back and stay on /new-session” failure mode.

2. Keep the onboarding tour from interfering with navigation.
   - In `src/components/onboarding/OnboardingTour.tsx`, verify the allowlist path for `data-tour-allow="true"` covers both click and touch interception consistently.
   - Harden the cleanup so the tour fully releases any temporary interaction locks, lifted z-index styles, and scroll restrictions when the tour closes, unmounts, or the route changes.
   - Preserve the current spotlight behavior, tooltip positioning, and scroll-lock rules for active tour steps.

3. Validate the navigation behavior against the actual failure cases.
   - Confirm the Back button works when arriving from Home.
   - Confirm it still works when `/new-session` is opened with no usable history stack.
   - Confirm closing or leaving the tour does not leave behind invisible blockers.

Technical details
- Root cause is likely not just layering. `SessionForm.tsx` currently uses `onClick={() => navigate(-1)}` on the Back button.
- In this app, `SessionForm` is a flow page, but browser/native preview history can be empty, replaced, or point to the same route. In those cases `navigate(-1)` can be a no-op or effectively keep the user on `/new-session`.
- The onboarding overlay was already partially hardened with `data-tour-allow`, but it still needs route-exit cleanup verification so no stale lock remains.
- Files to update:
  - `src/pages/SessionForm.tsx`
  - `src/components/onboarding/OnboardingTour.tsx`

Expected result
- The Back button always responds.
- Users return to the previous in-app page when history is valid.
- Users fall back to Home when history is invalid or missing.
- No leftover invisible overlay or scroll lock remains after the tutorial closes or the user leaves the page.