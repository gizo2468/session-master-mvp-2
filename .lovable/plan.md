Refactor the "Duration (minutes)" input in the Break Time popup into a polished, custom mobile-app field.

### What we'll change
- File: `src/components/poker/BreakTimeModal.tsx`
- Replace the default `<Input type="number">` with a custom input wrapper built from a plain text input + left/right adornments.
- Keep numeric-only mobile keyboard via `inputMode="numeric"` and `pattern="[0-9]*"`.
- Keep existing validation logic (numbers only, 1–240 minutes).
- Left adornment: small `Clock` icon from `lucide-react`.
- Right adornment: fixed "minutes" suffix text.
- Increase vertical padding for a taller, more comfortable touch target.
- Use a dark input background, subtle border, rounded corners, and a soft yellow/gold focus glow matching the app theme.
- Change placeholder from "e.g. 15" to "15".
- No functional change to the break start flow or notes field.

### Visual target
- Clean, symmetrical inline-flex row: icon | input | suffix.
- Text remains prominent and centered/left-aligned.
- Focus state: ring glow in `hsl(var(--primary))` (gold accent).
- Dark background matches card/popover surfaces (`bg-card`/dark `bg-popover`).

### Validation preserved
- `onChange` still strips non-digit characters.
- `parsed` / `valid` checks remain unchanged.
- `handleStart` behavior unchanged.

### Files to edit
1. `src/components/poker/BreakTimeModal.tsx` — replace the duration input with the custom styled component.

No other files need changes unless a global CSS rule for hiding number spinners is required; we will avoid the issue entirely by using `type="text"` with numeric input mode.