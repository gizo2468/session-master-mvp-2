## Restore Brand Gold on Welcome Menu

In `src/components/onboarding/OnboardingTour.tsx`:

1. **Title** (line ~661): Revert the `Welcome to Session Master` heading to the gold brand token — remove the inline `style={{ color: '#1e293b' }}` and restore `text-primary`.

2. **Skip button** (line ~696): Currently `variant="ghost"` (renders foreground/dark text on the white card). Add `className="text-primary hover:text-primary hover:bg-primary/10"` so it shows in brand gold and keeps a subtle hover.

3. **Buttons unchanged** — the three outlined gold guide buttons stay as they are.

No other files affected.