## Goal
Make the `end-table-cashout` tour step attach reliably to the Total Payout field inside the End Table modal across all viewports and tournament states.

## Changes

### 1. `src/components/onboarding/OnboardingTour.tsx` — Skip scroll for dialog targets (Fix 2)
In `scrollTargetIntoCenter` (≈line 180), short-circuit when the target lives inside a Radix portal/dialog:

```ts
const scrollTargetIntoCenter = (el: HTMLElement) => {
  if (el.closest('[role="dialog"]')) return Promise.resolve();
  // ...existing appRoot scroll logic unchanged
};
```

Dialog content is `position: fixed` and already centered in the viewport; scrolling the app root just drifts the underlying page and makes the spotlight rect land off-screen on 390×540.

### 2. `src/components/onboarding/OnboardingTour.tsx` — Re-measure after Radix animation (Fix 3)
In `focusAndMeasure` (≈line 214), when `isModalStep` is true, add an extra delayed re-measure after the Radix open animation (~150ms) settles, in addition to the existing two rAFs:

```ts
await scrollTargetIntoCenter(el);
if (cancelled) return;
readRect();
window.requestAnimationFrame(() => {
  if (cancelled) return;
  readRect();
  window.requestAnimationFrame(() => {
    if (cancelled) return;
    setTooltipVisible(true);
    if (isModalStep) {
      // Radix dialog enter animation is ~150ms; re-measure after it settles
      // so the spotlight snaps onto the post-transform rect.
      measureTimer.current = window.setTimeout(() => {
        if (cancelled) return;
        readRect();
      }, 220);
    }
  });
});
```

Also extend the existing ResizeObserver effect (≈line 426) to additionally attach a one-shot `transitionend`/`animationend` listener on the closest `[role="dialog"]` ancestor, calling `readRect()` when it fires. This guarantees a re-measure even if the 220ms timeout is too short on slower devices.

### 3. `src/components/poker/EndTableDialog.tsx` — Hoist the anchor (Fix 1)
Move `data-tour="end-table-cashout"` off the inner `<div>` (line 118) and onto a stable wrapper that is always rendered while the dialog is open. Two options; recommend option A:

**Option A (preferred):** Add a sibling wrapper that always renders, even before the user picks Eliminated/Day Ended:

- Wrap the whole `<div className="py-4">` body content's payout area in a persistent `<div data-tour="end-table-cashout">` that contains either the reason picker or the payout form. The tour anchor becomes the modal body, so the MutationObserver can detect it the instant the dialog mounts. The tooltip will visually highlight the body region; copy already reads "Enter your final cash-out amount here…" which still makes sense as guidance.

**Option B:** Keep the anchor on the Total Payout block, but render an empty `<div data-tour="end-table-cashout" aria-hidden="true" />` outside the conditional as a fallback target. The auto-advance fires immediately; once the user selects Eliminated, the real visible block takes over (selector picks the first visible match via `getVisibleElement`, which already filters zero-size nodes).

Use **Option A**: cleaner, no hidden duplicate anchor, and matches the user's intent (the tooltip should always appear with the modal).

### Verification
1. Start the `start-session` tour → Active Tables → tap red End Table on a cash table.
   - Modal opens; tooltip auto-attaches to Total Payout area without scroll drift.
2. Repeat on a multi-day tournament table.
   - Tooltip appears as soon as the modal opens (over the reason picker), persists after picking Eliminated.
3. Resize to 390×540 — tooltip stays inside viewport, no off-screen drift.
4. Type a payout value — tour advances to `end-table-profit`; submit button enables.

## Technical notes
- No tour-state, persistence, or copy changes.
- No business logic changes in `EndTableDialog` — only the placement of the `data-tour` wrapper.
- `getVisibleElement` already prefers visible matches, so any defensive duplicate anchors remain safe.
