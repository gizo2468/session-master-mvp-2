# Plan

Show a one-time **Tutorial Complete** modal on the Home screen after the user finishes the End Session step of the tour.

## What I'll change

1. **`src/hooks/useOnboardingTour.ts`**
   - Add a small helper `markOnboardingCompletionPending()` that writes a `localStorage` flag (e.g. `onboarding_tour_show_completion = 'true'`).
   - Add a corresponding `clearOnboardingCompletionPending()` helper.
   - No change to existing `dismiss()` behavior — the completion flag is independent and set explicitly by the End Session flow.

2. **`src/components/onboarding/OnboardingTour.tsx`**
   - In the existing real End Session button click handler (the one that already calls `onClose()` for the summary/confirm step), also call `markOnboardingCompletionPending()` right before `onClose()` so the Home screen knows to show the celebration modal once the user lands there.

3. **New component `src/components/onboarding/TourCompletionDialog.tsx`**
   - Small `Dialog`-based modal using existing UI primitives and theme tokens (gold accent on dark surface — consistent with premium dark mode).
   - Content:
     - Title: "Tutorial Complete"
     - Body: short congrats line + "You're all set to use Session Master."
     - Single primary button: **Start Playing**
   - On button click (or dismiss): call `clearOnboardingCompletionPending()` and close.

4. **`src/pages/Index.tsx`** (Home)
   - On mount and on focus, read the `onboarding_tour_show_completion` flag.
   - If set, render `TourCompletionDialog` once. On close, clear the flag so it never re-appears.
   - Only render after splash removed and only on the Home route (Index already gates Home tour rendering this way).

## Result

- After tapping the real red End Session button, the session ends and the user lands on Home as today.
- A single celebration modal appears on Home congratulating the user. Tapping **Start Playing** closes it permanently.
- Tutorial completion state (`onboarding_tour_completed`) stays `true`, so the tour itself does not re-trigger.
- Outside the tutorial completion path, nothing changes.

## Technical notes

- Flag stored in `localStorage` under `onboarding_tour_show_completion` so it survives the navigation from Session → Home.
- Cleared on first display + button tap to guarantee one-time appearance.
- No backend, no routing changes, no changes to End Session business logic.
