Change the "Active Tables Detected" warning card in the End Session sheet from yellow to red, matching the End Session button's red family, and add a very subtle continuous pulse animation.

### Changes
1. **`src/components/poker/EndSessionSheet.tsx`** (warning button at lines 133-149)
   - Replace yellow color classes with red equivalents:
     - Background: `bg-red-50` (was `bg-yellow-50`)
     - Hover: `hover:bg-red-100` (was `hover:bg-yellow-100`)
     - Border: `border-red-200` (was `border-yellow-200`)
     - Title/icon text: `text-red-600` (was `text-yellow-800`)
     - Body/list text: `text-red-700` (was `text-yellow-700`)
   - Add a subtle pulse animation class `animate-pulse-subtle` to the warning card.
   - Keep layout, text, spacing, and click behavior exactly as-is.

2. **`tailwind.config.ts`**
   - Add a new `pulse-subtle` keyframe and animation entry under `theme.extend`.
   - The animation should be soft and non-distracting — a gentle red shadow-ring pulse:
     ```text
     0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.15); }
     50% { box-shadow: 0 0 0 5px rgba(220, 38, 38, 0.05); }
     ```
     Duration ~2.5s, ease-in-out, infinite.

### Out of scope
- No changes to text, padding, margins, centering, or click behavior.
- No changes to the End Session button, Session Summary section, or other parts of the sheet.