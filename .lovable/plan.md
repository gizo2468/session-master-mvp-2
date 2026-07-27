## Add brand icons to three popup titles

Match the "My Notes" title pattern (icon + text, gold color, centered) in three dialogs. Reuse icons from the corresponding Live Session action buttons.

### Icon mapping (from `SessionTimerCard.tsx` action buttons)
- **BB / Stack Update** → `CircleDot` (same as BB/Stack Update button)
- **Select Table for Hand** → `Hand` (same as Upload Hand button)
- **Take a Break** → `Coffee` (same as Break Time button)

### Files to change

**`src/components/poker/BBStackUpdateModal.tsx`**
- Import `CircleDot` from `lucide-react`.
- Wrap the existing `DialogTitle` text in an inline-flex row with `CircleDot` (`h-5 w-5`) on the left, `gap-2`, centered. Keep `text-primary` on both icon and title.

**`src/components/poker/HandTableSelectionModal.tsx`**
- Import `Hand` from `lucide-react`.
- Same treatment: `Hand` icon (`h-5 w-5`) + "Select Table for Hand" text, gold, centered as one group.

**`src/components/poker/BreakTimeModal.tsx`**
- Import `Coffee` from `lucide-react`.
- Same treatment: `Coffee` icon (`h-5 w-5`) + "Take a Break" text, gold, centered as one group.

### Constraints
- No changes to wording, close button, fields, layout, or behavior.
- Icon size (`h-5 w-5`) and `gap-2` match the `MyNotesCard` "My Notes" header pattern.
- Both icon and title use `text-primary` (existing gold token).
