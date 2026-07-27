## Goal
After the user taps the red "Active Tables Detected" warning card and lands on the Active Tables section, briefly show the existing tap-hand animation over the "End Table" button — visual only, no click, auto-hides after a few seconds.

## Approach
Reuse the existing `Hand` icon + `.tour-tap-hand` CSS animation (already used by `OnboardingTour`) via a small, self-contained overlay component. Trigger it from the warning-card tap using a window custom event so no cross-component state plumbing is needed.

## Changes

### 1. New file: `src/components/poker/EndTableTapHint.tsx`
- Listens for a `window` event `sm:show-end-table-hint`.
- On event: locates the first `[data-tour="end-table-button"]` in the DOM, computes its viewport rect, and renders a fixed-position `<Hand />` icon centered over it using the existing `tour-tap-hand` class (same animation as tutorial).
- Uses `pointer-events-none` so it cannot click the button.
- Auto-hides after ~3s. Also listens to `scroll`/`resize` while visible to keep it aligned.
- Renders via a portal to `document.body` at a high `z-index` (below modals).

### 2. `src/pages/LiveSession.tsx` (or wherever `LiveSessionTables` is mounted)
- Mount `<EndTableTapHint />` once at the page level so it is available whenever the Active Tables section is on screen.

### 3. `src/components/poker/EndSessionSheet.tsx`
- In the existing warning-card `onClick`, after the `scrollIntoView` timeout, dispatch `window.dispatchEvent(new CustomEvent('sm:show-end-table-hint'))` (slight extra delay so scroll settles before rect is measured).
- No layout/text/styling changes to the warning card itself.

## Guardrails
- Component is inert (`pointer-events-none`); never fires a click.
- Only shows when the event fires (i.e., only via the warning-card path).
- Uses existing animation — no new keyframes or design tokens.
- No changes to tutorial logic, button design, navigation, or layout.

## Technical details
- Need to confirm the LiveSession page file to mount the hint. Will locate the page that renders `LiveSessionTables` and mount there.
- If multiple active tables exist, the hint targets the first `[data-tour="end-table-button"]` (top-most, matching the section the user scrolled to). Acceptable since the intent is a general "tap End Table" cue.
