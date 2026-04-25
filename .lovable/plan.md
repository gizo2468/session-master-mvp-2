## Multi-Step Spotlight Onboarding Tour

Replace the existing single "Tap here to start" hint with a 4-step guided tour that darkens the screen, cuts a spotlight hole around each target, and shows a fading tooltip with Skip / Next / Done buttons.

### Approach
Build a small **custom overlay** (no `react-joyride` dependency) using:
- An SVG `<mask>` over a fixed dark layer to cut the spotlight hole — this gives us a real darkened backdrop with a clear, animated rectangle around the highlighted element.
- `framer-motion` (already in deps via shadcn ecosystem; will verify and add if missing) for the tooltip fade/slide animation that matches the success-toast style.
- Element targeting via `data-tour` attributes on existing elements (no layout changes), measured with `getBoundingClientRect()` and re-measured on resize/scroll.

A custom build is preferred here over `react-joyride` because:
- The Home screen lives inside a custom fixed-viewport layout (`AppLayout`'s `overflow-y-auto` container) — Joyride's positioning often misbehaves with non-window scrollers.
- We get pixel-perfect control over the spotlight shape (rounded rect with padding) and the existing premium dark/gold visual language.
- Zero new dependencies if framer-motion is already present (otherwise one small install).

### Step Sequence
| # | Target | Tooltip copy |
|---|---|---|
| 1 | Logo in header | "Welcome to Session Master — your poker tracking HQ." |
| 2 | Start Session chip (NewSessionButton wrapper) | "Tap here to start a new poker session." |
| 3 | Sessions Stats card (StatsQuickView root) | "Track your sessions, record, and win rate at a glance." |
| 4 | Header nav buttons (Settings + Profile group) | "Open Settings or your Profile any time from here." |

Final step's button reads **Done** and closes the tour. A persistent **Skip** link in the corner closes from any step. All closes (complete or skip) write `onboarding_start_session_seen=true` to localStorage.

### Files

**New: `src/components/onboarding/OnboardingTour.tsx`**
- Props: `steps: { selector: string; title: string; body: string }[]`, `onClose: () => void`.
- State: `currentStep`, `targetRect` (DOMRect or null).
- Effect: re-measure target on `currentStep` change, on `window.resize`, and on scroll of the nearest scrollable ancestor (the `AppLayout` div). Smooth-scroll target into view before measuring.
- Renders a `position: fixed` full-viewport SVG with:
  - A black rect at 65% opacity covering the screen.
  - A `<mask>` that punches a rounded rectangle hole over `targetRect` (with ~8px padding, 12px corner radius) using `feGaussianBlur` for a soft edge.
  - A subtle gold (`#DAA520`) animated stroke around the spotlight matching the app's premium dark theme.
- Renders a Framer Motion tooltip card positioned **below** the target (or above if target is in the bottom half), with:
  - Fade + slide-up entrance (`opacity 0→1`, `y 8→0`, 250ms) keyed on `currentStep`.
  - Title (gold), body text, step indicator dots (e.g. `● ○ ○ ○`), Skip button (ghost) and Next/Done button (primary).
  - Uses existing `Card`/`Button` primitives so theming matches success toasts.
- Backdrop blocks pointer events; only the tooltip buttons are interactive (clicks on the spotlight area do NOT trigger the underlying element — prevents accidental navigation).
- Cleans up listeners on unmount.

**New: `src/hooks/useOnboardingTour.ts`** (small)
- Reads/writes `onboarding_start_session_seen` localStorage key.
- Exposes `{ shouldShow, dismiss }`.
- Listens to a `window` event `onboarding-tour:reset` so the Settings reset button can re-trigger the tour without a navigation refresh (in addition to clearing localStorage).

**Edit: `src/pages/Index.tsx`**
- Replace `OnboardingHint` import + render with `OnboardingTour`.
- Pass a fixed `steps` array referencing data-tour selectors:
  - `[data-tour="logo"]`, `[data-tour="start-session"]`, `[data-tour="stats"]`, `[data-tour="nav"]`.
- Add `data-tour="logo"` to the `<Logo />` wrapper, `data-tour="start-session"` to the `NewSessionButton` wrapper div, `data-tour="stats"` to the `<StatsQuickView />` wrapper, and `data-tour="nav"` to the left header `<div className="flex-1 flex justify-start gap-2">` containing the Settings + Profile buttons.
- Tour starts only after splash is removed (existing `splashRemoved` gate).

**Edit: `src/pages/Settings.tsx`**
- The "Reset Onboarding" button already calls `localStorage.removeItem(...)`. Add one line: `window.dispatchEvent(new Event('onboarding-tour:reset'))` so if the user navigates back to Home (or is already there in a future visit), the tour fires immediately. Update the toast description to "The guided tour will replay next time you visit Home."

**Edit: `src/components/OnboardingHint.tsx`**
- Delete (no longer referenced).

**Edit: `src/index.css`**
- Remove the now-unused `tap-hint` keyframe and `.animate-tap-hint` class.

### Dependency check
If `framer-motion` is not already in `package.json`, add it (it is commonly already present from shadcn). If absent, fall back to plain CSS transitions (`transition-opacity duration-300` + `translate-y` classes already in Tailwind config) — no install needed. The implementation will check and use whichever is available.

### What stays unchanged
- All existing chip layout, NewSessionButton, StatsQuickView, header structure.
- Storage key name (`onboarding_start_session_seen`) — preserves user dismissal state.
- No new database tables, API calls, or auth changes.
- No changes to AppLayout or routing.

### Behavior contract
- First-time visitor → splash → tour auto-starts on step 1.
- Tour is **modal**: only Skip / Next / Done dismiss it (no tap-outside-to-close, no auto-timeout).
- After completion or Skip, localStorage flag is set; tour will not show again unless reset.
- Reset Onboarding in Settings clears the flag and dispatches the reset event so the tour will run on the next Home visit.
