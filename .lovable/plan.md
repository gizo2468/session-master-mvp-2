## Tutorial Menu — Unified Button Styling

Update the welcome menu in `src/components/onboarding/OnboardingTour.tsx` (lines 661–693) so all three guide buttons share the same outlined look, and darken the title.

### Changes

1. **"Start a Session Guide" button** — switch from `variant="poker"` (solid gold fill) to the same outlined style as the other two:
   - `variant="outline"`
   - Same className: `w-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary`
   - This guarantees identical padding, border-radius, and font-weight across all three buttons (they'll all use shadcn `Button` `size="sm"` outline).

2. **Title color** — Change `"Welcome to Session Master"` heading from `text-primary` (gold) to a dark slate. Note: I'm assuming you meant this title (the screen has no "Master Your Sessions" text). Since the menu card has a white/light background, dark slate will read clearly.
   - Replace `text-primary` with an inline color `#1e293b` (slate-900-ish) via `style={{ color: '#1e293b' }}`, keeping `font-bold` and centering.

3. **No other changes** — subtitle, Skip button, card chrome, and spotlight logic remain untouched.

### Note on design system

Project memory specifies app-wide gold-on-dark theme. This menu card already uses a light surface (`bg-card` rendering white in the screenshot), so the requested slate title is consistent with that local light-card context. The three outlined gold buttons remain on-brand.

### Files

- `src/components/onboarding/OnboardingTour.tsx` — lines 661 (title) and 669–676 (first button).