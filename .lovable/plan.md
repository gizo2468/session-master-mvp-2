## Goal
Guarantee the onboarding tour overlay (spotlight + tooltip + nav buttons) renders **above** the Radix dialog when an `isModalStep` is active, so the user never sees the tour disappear behind the End Table modal.

## Context
Fixes 1–3 from the previous round are already applied:
- Anchor `data-tour="end-table-cashout"` is hoisted to the always-rendered modal body wrapper in `EndTableDialog.tsx`.
- `scrollTargetIntoCenter` short-circuits for `[role="dialog"]` targets.
- `focusAndMeasure` re-measures after Radix's enter animation (220ms timeout + `animationend`/`transitionend` listeners).
- Auto-advance from `table-actions` → `end-table-cashout` is wired (poll + MutationObserver + delegated click).

The remaining gap is purely a **stacking-context** issue: Radix `DialogOverlay` and `DialogContent` use `z-50`. The tour root is `z-[120]` when `stepInsideDialog`, which *should* win, but Radix portals append after our root in the body, and on iOS Safari the safe-area insets sometimes create their own stacking context, causing the tooltip card to read as hidden by the dialog.

## Change

### `src/components/onboarding/OnboardingTour.tsx` (line ~998)
Raise the tour root z-index well above any Radix portal when the current step lives inside a dialog. Same for the menu-mode root (line ~815) for consistency.

```tsx
// Tour root (line 998)
className={`fixed inset-0 ${stepInsideDialog ? 'z-[9999]' : 'z-[100]'} pointer-events-none`}
```

```tsx
// Menu mode root (line 815)
className="fixed inset-0 z-[9999]"
```

Also bump the `[data-tour-allow="true"]` lift (line 393) from `'101'` → `'10000'` so opted-in elements (Back button, etc.) remain clickable above the new tour ceiling when a modal step is active.

No other behavior changes. Tooltip-internal `zIndex: 20` stays as-is (it is relative to the tour root's stacking context).

## Verification
1. Run the start-session tour → Active Tables → tap red **End Table**.
2. Modal opens; tour spotlight + tooltip + Next/Skip buttons render **on top** of the dialog content and overlay on both 390×540 and desktop.
3. Tooltip text reads the new "Total Payout" copy; submit button stays disabled until a value is entered; tour advances on input.
4. No regression on non-modal steps — they still render at `z-[100]`.

## Technical notes
- Tailwind arbitrary values `z-[9999]`/`z-[10000]` compile to plain integers; no config change needed.
- Radix `DialogContent` is `z-50`; nothing else in the project currently uses higher than `z-[120]`, so `z-[9999]` is safe headroom without affecting toasts (toasts use Sonner's own portal which we won't display during the tour).
