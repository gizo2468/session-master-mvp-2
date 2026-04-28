# Onboarding: Welcome screen as 3-path menu

## What changes (visible)

Step 1 (Welcome) becomes a menu:
- Title: "Welcome to Session Master" (kept)
- Short intro line: "What would you like to learn?"
- Three vertically stacked, centered buttons:
  1. **Start a Session Guide** — gold (`variant="poker"`), primary action
  2. **Home Page Guide** — outlined gold
  3. **Dashboard Guide** — outlined gold
- **No Next button** on this step. Skip remains (top-left of footer).
- Tooltip auto-expands vertically; dots row hidden until a path is chosen.

After a button click → tour switches to the chosen path's step list and advances to its first real step. Skip closes the tour entirely at any time.

## Paths

- **start-session** (existing flow): Start chip → Game setup → Stakes → Optional details → Submit → live scoreboard → live actions → live controls.
- **home-guide** (placeholder, single step): highlights `[data-tour="logo"]` area with copy "More home tips coming soon!" + Done button. (Real steps can be added later — the structure supports it.)
- **dashboard-guide** (placeholder, single step): same pattern, copy "Dashboard guide coming soon!" + Done.

Dots reflect the length of the chosen path; current index shown.

## Files to edit

1. **`src/components/onboarding/tourSteps.ts`**
   - Add `export type TourPathId = 'start-session' | 'home-guide' | 'dashboard-guide'`.
   - Replace `TOUR_STEPS` with `TOUR_PATHS: Record<TourPathId, TourStep[]>`.
   - Keep a re-export `export const TOUR_STEPS = TOUR_PATHS['start-session']` for any leftover imports during transition.
   - The Welcome step is NOT inside any path — it's the menu, owned by `OnboardingTour`.

2. **`src/hooks/useOnboardingTour.ts`**
   - Persist `activePath: TourPathId | null` in `localStorage` under `onboarding_tour_path`.
   - Expose `activePath`, `selectPath(id)` (sets path + step 0 + dispatches change event), and existing `setStep` / `dismiss` (dismiss also clears path).
   - Reset event clears path too.

3. **`src/components/onboarding/OnboardingTour.tsx`**
   - New props: `activePath: TourPathId | null`, `onSelectPath: (id) => void`.
   - When `activePath === null`: render a **menu tooltip** centered on screen (no spotlight, no SVG cutout, no tap-hand). Body shows the 3 stacked buttons; hide Next/Previous/dots; keep Skip.
   - When `activePath !== null`: behave as today using `steps` (passed from page), with `currentStep` controlled.

4. **`src/pages/Index.tsx`**, **`src/pages/SessionForm.tsx`**, **`src/pages/LiveSession.tsx`**
   - Import `TOUR_PATHS` + `selectPath`/`activePath` from hook.
   - Compute `steps = activePath ? TOUR_PATHS[activePath] : []`.
   - Gating per page:
     - `Index`: show tour when `activePath === null` (menu) OR when `activePath` step's route is `/`.
     - `SessionForm`: show only when `activePath === 'start-session'` and current step's route is `/new-session`.
     - `LiveSession`: show only when current step's route is `/session`.
   - Pass `activePath` and `onSelectPath` to `OnboardingTour`.
   - In `SessionForm`, the existing `setTourStep(tourStep + 1)` call after submit stays (still valid within `start-session` path).

## Technical notes

- Welcome menu tooltip uses fixed center positioning (reuse existing "no spotlight" branch by passing `step` with a non-existent selector — but cleaner: add an explicit `mode === 'menu'` early-return block inside `OnboardingTour` that renders only the tooltip card, identical styling, with the 3 buttons).
- Buttons use existing variants: primary = `variant="poker"`, others = `variant="outline"`. Stack with `flex flex-col gap-2`. Each `size="sm"` and `w-full`.
- Dots indicator and Previous/Next entirely hidden in menu mode.
- Skip in menu mode calls `dismiss()` (sets completed, clears path).
- Selecting **Home Page Guide** or **Dashboard Guide** while user is on `/` works without navigation since their first step also targets a `/` element. **Dashboard Guide** placeholder uses `[data-tour="logo"]` for now so it renders on `/` without needing a route change; a follow-up can add real `/dashboard` anchors.

## Out of scope (follow-up)

- Filling out real steps for Home and Dashboard guides — current change ships placeholders so the menu + path machinery works end-to-end. You can tell me which elements to highlight next and I'll add them.