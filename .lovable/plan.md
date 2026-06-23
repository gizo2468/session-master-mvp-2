Add a "Skip Tutorial" button to the "You're All Set!" (`submit-session`) step only.

**Changes in `src/components/onboarding/OnboardingTour.tsx`:**
1. Import `useNavigate` from `react-router-dom`.
2. Instantiate `const navigate = useNavigate()`.
3. Add a `handleSkipTutorial` callback:
   - Calls `onClose()` (marks tutorial completed via `dismissOnboardingTour` and prevents re-trigger).
   - Then `navigate('/', { replace: true })` to return the user to Home.
4. In the existing buttons row (inside the right `flex items-center gap-2` container), conditionally render the new button only when `isSubmitSessionStep` is true:
   - Use `variant="ghost"`, `size="sm"`, and the existing muted-foreground styling already used by the `game-setup` Skip button.
   - Label: "Skip Tutorial".

**Behavior:**
- Button appears **only** on the "You're All Set!" step.
- Tapping it ends the tour, marks it completed in localStorage (same end-state as pressing Done on the last step), closes the overlay, and redirects to `/`.
- No other steps are affected.
- Existing mobile/desktop responsive layout is preserved.

No other files change.