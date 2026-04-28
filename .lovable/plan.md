## Restructure Onboarding Welcome into a 3-Path Menu

The previous restructure attempt was never actually applied — `tourSteps.ts` still exports a single linear `TOUR_STEPS` array, and `OnboardingTour.tsx` has no menu state. This plan rewrites the Welcome step as a menu with three vertically stacked, theme-styled buttons (Start a Session Guide, Home Page Guide, Dashboard Guide). The tour cannot advance from the Welcome step except by clicking one of the buttons or Skip — there is no Next button on the menu.

### 1. Split tour into 3 named paths

Rewrite `src/components/onboarding/tourSteps.ts`:

```ts
export type TourPathId = 'start-session' | 'home-guide' | 'dashboard-guide';

export const TOUR_PATHS: Record<TourPathId, TourStep[]> = {
  'start-session': [/* the existing 8 steps after Welcome — chip → game-setup → stakes → optional-details → submit-session → live-scoreboard → live-actions → live-controls */],
  'home-guide': [
    { selector: '[data-tour="nav"]',           title: 'Quick Access',     body: 'Settings and your profile live up here.', interactive: true, route: '/' },
    { selector: '[data-tour="logo"]',          title: 'Your Home Base',   body: 'Tap the logo from anywhere to come back here.', interactive: true, route: '/' },
    { selector: '[data-tour="start-session"]', title: 'Start a Session',  body: 'This chip launches a new session whenever you sit down.', interactive: true, circle: true, route: '/' },
    { selector: '[data-tour="stats"]',         title: 'Your Stats',       body: 'A quick snapshot of your record and recent results.', interactive: true, route: '/' },
  ],
  'dashboard-guide': [/* 3–4 steps anchored to existing Dashboard sections (h1 header, Tabs, MyNotesCard) — selectors added in step 5 */],
};

// Back-compat shim while migrating
export const TOUR_STEPS = TOUR_PATHS['start-session'];
```

Route type widens to include `'/dashboard'`.

### 2. Welcome step becomes a menu (not a path step)

The Welcome card is rendered by `OnboardingTour` itself when `activePath === null`. It is **not** an entry in any path array, so dot indicators only appear once a path is chosen.

Menu tooltip contents:
- Title: **Welcome to Session Master**
- No body paragraph (replaced by buttons, per request)
- Three full-width stacked buttons, centered:
  - `Start a Session Guide` — `Button` default variant (gold)
  - `Home Page Guide` — `Button` outline variant (gold border on dark)
  - `Dashboard Guide` — `Button` outline variant
- `Skip` link bottom-left
- **No Next, no Previous, no dot indicator**
- Anchored to `[data-tour="logo"]` (same spotlight as the screenshot)
- Tooltip card auto-grows vertically — buttons live in `flex flex-col gap-2`, no fixed height.

### 3. Hook: track active path

Extend `src/hooks/useOnboardingTour.ts`:
- New `localStorage` key `onboarding_tour_path` storing `TourPathId | null`.
- Hook returns `{ shouldShow, currentStep, setStep, dismiss, activePath, selectPath, exitToMenu }`.
- `selectPath(id)`: writes path, resets step to 0, fires the existing `STEP_CHANGED_EVENT` so other pages re-read.
- `dismiss()` and the existing reset clear both `step` and `path`.

### 4. OnboardingTour component changes

`src/components/onboarding/OnboardingTour.tsx` accepts new props `activePath: TourPathId | null` and `onSelectPath: (id: TourPathId) => void`.

- When `activePath === null`: render the menu tooltip described above. Spotlight uses `[data-tour="logo"]`. No Next/Previous/dots. Strict — the only ways out are the 3 buttons or Skip.
- When `activePath` is set: render `TOUR_PATHS[activePath]` exactly like today (existing per-step special cases preserved: chip auto-advance, tap-hand on stakes/buy-in, hide Previous on game-setup, hide Next on chip / submit). Dot indicator length = `TOUR_PATHS[activePath].length`.

### 5. Page wiring

`src/pages/Index.tsx`:
- Read `activePath` and `selectPath` from the hook.
- Render `<OnboardingTour>` when `splashRemoved && shouldShow` AND (`activePath === null` OR `TOUR_PATHS[activePath][step].route === '/'`).
- `onSelectPath` handler:
  - `start-session` → `selectPath('start-session')`, stay on `/` (first step is the chip).
  - `home-guide` → `selectPath('home-guide')`, stay on `/`.
  - `dashboard-guide` → `selectPath('dashboard-guide')` then `navigate('/dashboard')`.

`src/pages/SessionForm.tsx` and `src/pages/LiveSession.tsx`:
- Switch from `TOUR_STEPS` to `TOUR_PATHS[activePath]`.
- Gate render on `activePath === 'start-session'` AND step's `route` matches the page.

`src/pages/Dashboard.tsx`:
- Add `data-tour` attributes to 3–4 existing prominent sections (the `h1` "Dashboard" header, the `TabsList`, and the `MyNotesCard` wrapper).
- Mount `<OnboardingTour>` (gated on `activePath === 'dashboard-guide'` and step `route === '/dashboard'`), passing the hook's controlled state.

### 6. Styling note

No new tokens. Buttons use existing `Button` variants which already render in the project's gold/dark theme. Stack with `flex flex-col gap-2`, `Button` is full-width by default within the card.

### Files to edit

- `src/components/onboarding/tourSteps.ts` — `TOUR_PATHS` map, widen route type, keep `TOUR_STEPS` shim.
- `src/components/onboarding/OnboardingTour.tsx` — menu state, accept `activePath` / `onSelectPath`, dot length follows active path.
- `src/hooks/useOnboardingTour.ts` — persist `activePath`, expose `selectPath`.
- `src/pages/Index.tsx` — render menu, dispatch path selection, navigate when dashboard chosen.
- `src/pages/SessionForm.tsx` — gate on `activePath === 'start-session'`, read steps from `TOUR_PATHS`.
- `src/pages/LiveSession.tsx` — same gating.
- `src/pages/Dashboard.tsx` — add `data-tour` anchors and mount the tour for the dashboard path.

### Out of scope

- No copy changes to existing step bodies.
- No new colors.
- Existing "completed" flag is preserved; users who already finished stay finished.
