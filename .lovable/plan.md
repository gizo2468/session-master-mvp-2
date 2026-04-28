## Restructure Onboarding into 3 Selectable Paths

The Welcome tooltip becomes a menu. The user picks one of three guided paths; each runs as its own self-contained mini-tour with its own dot indicator. Skip remains available everywhere.

### 1. Define the three paths

In `src/components/onboarding/tourSteps.ts`, replace the single flat `TOUR_STEPS` array with named path collections, all sharing the existing `TourStep` shape.

- `START_SESSION_PATH` (existing flow, unchanged steps):
  1. `start-session` (Home chip)
  2. `game-setup` (/new-session)
  3. `stakes` (/new-session)
  4. `optional-details` (/new-session)
  5. `submit-session` (/new-session)
  6. `live-scoreboard` (/session)
  7. `live-actions` (/session)
  8. `live-controls` (/session)

- `HOME_GUIDE_PATH` (new, all on `/`, all `interactive: true`):
  1. `nav` — "Quick Access" — gear, profile, etc.
  2. `logo` — "Your Home Base" — tap logo to return home anytime.
  3. `start-session` — "Start a Session" — chip launches a new session.
  4. `stats` — "Your Sessions Stats" — quick snapshot of record + results.

- `DASHBOARD_GUIDE_PATH` (new, route `/dashboard`):
  - First step navigates user to `/dashboard` (handled by triggering `navigate('/dashboard')` when the path is selected — same pattern the start-session path uses to traverse routes).
  - Steps highlight 3–4 existing sections on the Dashboard. We will add `data-tour` attributes to the most prominent existing blocks in `src/pages/Dashboard.tsx` (e.g. summary cards, charts area, filters). Exact selectors finalized while implementing by reading `Dashboard.tsx`.

Export:
```ts
export type TourPathId = 'start-session' | 'home-guide' | 'dashboard-guide';
export const TOUR_PATHS: Record<TourPathId, TourStep[]> = { ... };
```

For backward compatibility, keep a `TOUR_STEPS` export pointing at `START_SESSION_PATH` so nothing breaks during the swap, then migrate the three pages (`Index.tsx`, `SessionForm.tsx`, `LiveSession.tsx`) to read from the active path.

### 2. Welcome step (menu)

The Welcome step is no longer part of any path; it is rendered as a special "menu" state by `OnboardingTour` when no path has been chosen yet.

- Render the existing tooltip card (title + body) but replace the Next button with three stacked action buttons:
  - **Start a Session** — primary (gold) button.
  - **Home Guide** — outline button with gold border / foreground.
  - **Dashboard Guide** — outline button with gold border / foreground.
- Skip link stays bottom-left.
- No Previous, no dot indicator while on the menu (there is no path yet).
- Buttons full-width, stacked vertically with `gap-2`, using existing `Button` variants (`default` for primary, `outline` for the other two) so they automatically match the brand gold/dark theme.
- Menu is anchored to the `[data-tour="logo"]` element (same as today's Welcome step) so the spotlight matches the screenshot.

### 3. State: which path is active

Extend `useOnboardingTour` (`src/hooks/useOnboardingTour.ts`):

- New localStorage key `onboarding_tour_path` storing `TourPathId | null`.
- Hook returns `{ shouldShow, currentStep, setStep, dismiss, activePath, selectPath, exitToMenu }`.
- `selectPath(id)`: sets `activePath`, resets step to 0, dispatches the existing `STEP_CHANGED_EVENT` so other pages re-read state. If the chosen path's first step lives on a different route, the caller (Index page) navigates there.
- `dismiss()` also clears `activePath`.
- Reset (Settings → "Restart tour") clears both `path` and `step`.

### 4. OnboardingTour component changes

In `src/components/onboarding/OnboardingTour.tsx`:

- Accept new props: `activePath: TourPathId | null`, `onSelectPath: (id: TourPathId) => void`.
- When `activePath === null`, render the menu tooltip (no spotlight cutout, anchored on `[data-tour="logo"]`, three buttons, no dots, no Next/Previous).
- When `activePath` is set, behave exactly as today but using `steps` for that path (so dot indicator length = path length, not 9).
- Keep all existing per-step special cases (`start-session` chip auto-advance, tap-hand on stakes/buy-in, hide Previous on `game-setup`, hide Next on `start-session` / `submit-session`).

### 5. Page wiring

`src/pages/Index.tsx`:
- Read `activePath` from the hook. The tour is visible on `/` either when no path is selected (menu) or when the active path's current step has `route === '/'`.
- Pass `onSelectPath` down. When the user selects `start-session` or `home-guide`, stay on `/`. When the user selects `dashboard-guide`, call `navigate('/dashboard')` and `selectPath('dashboard-guide')`.

`src/pages/SessionForm.tsx` and `src/pages/LiveSession.tsx`:
- Only render the tour when `activePath === 'start-session'` AND the current step's route matches the page (existing pattern, just gated on path id).

`src/pages/Dashboard.tsx` (new):
- Add the OnboardingTour render block, only when `activePath === 'dashboard-guide'` and the step's route is `/dashboard`.
- Add `data-tour` attributes to 3–4 anchor elements (chosen during implementation by reading the file).

### 6. Styling

Menu buttons use existing tokens — no new colors:
```tsx
<div className="flex flex-col gap-2 mb-2">
  <Button onClick={() => onSelectPath('start-session')}>Start a Session</Button>
  <Button variant="outline" onClick={() => onSelectPath('home-guide')}>Home Guide</Button>
  <Button variant="outline" onClick={() => onSelectPath('dashboard-guide')}>Dashboard Guide</Button>
</div>
```
Outline variant already renders gold border on the dark surface per the project theme.

### Files to edit

- `src/components/onboarding/tourSteps.ts` — split into 3 named paths + `TOUR_PATHS` map.
- `src/components/onboarding/OnboardingTour.tsx` — menu state, accept `activePath` / `onSelectPath`, dot indicator length follows the active path.
- `src/hooks/useOnboardingTour.ts` — persist `activePath`, expose `selectPath` / `exitToMenu`.
- `src/pages/Index.tsx` — render menu, dispatch path selection, navigate when dashboard chosen.
- `src/pages/SessionForm.tsx` — gate on `activePath === 'start-session'`.
- `src/pages/LiveSession.tsx` — gate on `activePath === 'start-session'`.
- `src/pages/Dashboard.tsx` — mount OnboardingTour for the dashboard path; add `data-tour` anchors.

### Out of scope

- No changes to copy of existing steps.
- No new colors or theme tokens.
- No migration of the persisted "completed" flag — users who already finished the tour stay finished.
