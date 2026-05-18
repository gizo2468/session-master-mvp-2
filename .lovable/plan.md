## Root causes

### 1. Total Payout input is not editable
`OnboardingTour.tsx` installs a document-level **capture-phase `mousedown` listener** (`onMouseDown`, line ~565) for the focus-freeze / iOS scroll-restore logic. When the highlighted element IS the input itself (the cashout step), this listener fires on the very tap that should open the keyboard, calls `e.preventDefault()`, and then manually focuses the input with `{ preventScroll: true }`.

On iOS/mobile this kills the user-gesture chain that opens the numeric keyboard, and on desktop it interferes with caret placement / native click handling. The freeze machinery was designed for a non-modal scenario where iOS auto-scrolls the page on focus — inside a Radix `position: fixed` dialog there is nothing to fight, so the whole interception is harmful here.

### 2. Profit/Loss Next + Previous "freeze" the tour
The tour root is portaled to `document.body` (a sibling of the Radix `DialogContent`). Radix Dialog by default treats any pointer event outside `DialogContent` as an outside-interaction and fires `onPointerDownOutside` → closes the dialog.

So when the user clicks **Next** or **Previous** in the tooltip card on the Profit/Loss step:
- Radix dispatches close → `EndTableDialog` unmounts.
- The next step's selector (`end-table-notes` or `end-table-cashout-input`) is no longer in the DOM.
- The tour's polling logic retries for ~4.8s then "skips" — visually identical to a freeze/crash.

The same mechanism breaks Previous on every modal step.

## Fixes

### Fix A — `src/components/onboarding/OnboardingTour.tsx`
1. **Tag the tour root** for outside-interaction detection: add `data-onboarding-tour="true"` to both portal roots (menu mode root around line 824 and tour root around line 1008).
2. **Disable the focus-freeze interception for modal steps.** In the big `useEffect` starting at line 483, early-return when `stepInsideDialog` is true (or when `isModalStep` is true). The dialog is `position: fixed` and centered — no iOS scroll-into-view to neutralize, and the `preventDefault` on mousedown is what blocks typing into the Total Payout field.
   - Keep all existing behavior for non-modal steps (Stakes, etc.) untouched.

### Fix B — `src/components/poker/EndTableDialog.tsx`
Prevent Radix from closing the dialog when the user interacts with the tour overlay:

```tsx
<DialogContent
  data-tour="end-table-intro"
  onPointerDownOutside={(e) => {
    if ((e.target as Element | null)?.closest('[data-onboarding-tour="true"]')) {
      e.preventDefault();
    }
  }}
  onInteractOutside={(e) => {
    if ((e.target as Element | null)?.closest('[data-onboarding-tour="true"]')) {
      e.preventDefault();
    }
  }}
>
```

This keeps normal "click outside to close" behavior for real outside clicks, but ignores clicks that originate inside the onboarding tour overlay (Next/Previous buttons, tooltip body, bands, hand icon).

## Files to update
- `src/components/onboarding/OnboardingTour.tsx`
- `src/components/poker/EndTableDialog.tsx`

## Verification
1. Run the tour to the **Total Payout** step. The tooltip is visible above the dialog; the input accepts typed digits and the mobile keyboard opens on tap.
2. Type a value → tour auto-advances to **Profit/Loss**.
3. On Profit/Loss, press **Previous** → returns to **Total Payout** with the dialog still open.
4. Press **Next** on Profit/Loss → advances to **Notes** with the dialog still open.
5. Continue to **End Table** confirm step; pressing the button advances to the final step as before.
6. Regression check: non-modal steps (Stakes, Game Setup, Submit) still behave correctly — iOS focus does not visibly scroll the page out from under the spotlight.

## Notes
- No backend or schema changes.
- The current modal integration, z-index layering, selectors, and portal mount are preserved — only the two interaction bugs are addressed.
