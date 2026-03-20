

## Plan: Make Start Session Section Render Instantly

### Root Cause

Two issues cause the delay:

1. **Index page is lazy-loaded** — `App.tsx` uses `lazyWithRetry(() => import("./pages/Index"))`, so the Home page JS chunk must be fetched and parsed before anything renders. The user sees `<LoadingScreen />` while this happens.
2. **Three chip images not preloaded** — Only `start-session-stopwatch.png` is preloaded in `index.html`. The three action button images (`chip-player-card.png`, `chip-my-notes.png`, `chip-coach.png`) load after the component mounts, causing a visible pop-in.

### Changes

**`src/App.tsx`** — Eagerly import the Index page instead of lazy-loading it:
- Change `const Index = lazyWithRetry(...)` to a direct `import Index from "./pages/Index"`
- This ensures the Home page component is bundled in the main chunk and renders immediately without a Suspense delay
- All other pages remain lazy-loaded (they benefit from code splitting since they aren't the landing page)

**`index.html`** — Add preload hints for the 3 chip images:
- Add `<link rel="preload" href="/src/assets/chip-player-card.png" as="image" />`
- Add `<link rel="preload" href="/src/assets/chip-coach.png" as="image" />`
- Add `<link rel="preload" href="/src/assets/chip-my-notes.png" as="image" />`

### Result
The Home page JS loads with the main bundle (no lazy chunk delay), and all four button images are already cached by the time the component mounts. The Start Session area and 3 action chips appear instantly.

