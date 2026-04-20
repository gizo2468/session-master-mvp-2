

## Add First-Time Onboarding Hint on Home Screen

### What we'll build
A lightweight, one-time animated overlay near the "Start Session" chip showing a tapping hand icon and "Tap here to start" text. It appears only for first-time users, auto-dismisses after ~4 seconds, and can be dismissed immediately by tapping anywhere.

### Persistence
Use `localStorage` key `onboarding_start_session_seen`. If set, never show the hint again. No database call needed for this.

### New component: `src/components/OnboardingHint.tsx`
- Renders a small overlay positioned absolutely within the Start Session container
- Contains:
  - A hand/pointer icon (Lucide `Hand` or `Pointer`) with a repeating CSS tap animation (translate-y bounce, ~3 cycles)
  - "Tap here to start" text in small, semi-transparent white/gold styling
- Auto-fades out after ~4 seconds using `setTimeout` + opacity transition
- On fade-out complete or on any tap/click, sets `localStorage` flag and unmounts
- Uses Tailwind `animate-bounce` variant or a custom subtle keyframe for the tap motion

### Changes to `src/pages/Index.tsx`
- Import `OnboardingHint`
- Add state: check `localStorage` for `onboarding_start_session_seen`
- Render `<OnboardingHint>` inside the Start Session relative container (the `div` at line 191), positioned just below the chip center, only when:
  - `localStorage` flag is not set
  - Splash screen has been removed (`splashRemoved === true`)
- On dismiss callback, set localStorage and hide

### Animation approach
- Custom CSS keyframe `tap-hint` in `src/index.css`: a gentle up-down motion (~6px) repeating 3 times, then hold
- Fade-in on mount (opacity 0→1 over 300ms)
- Fade-out after timeout or tap (opacity 1→0 over 500ms)

### What stays unchanged
- No layout changes
- No chip redesign
- No changes to NewSessionButton
- No new database tables or API calls

### Files to create/edit
1. **Create** `src/components/OnboardingHint.tsx` — the hint overlay component
2. **Edit** `src/index.css` — add `tap-hint` keyframe
3. **Edit** `src/pages/Index.tsx` — integrate the hint component

