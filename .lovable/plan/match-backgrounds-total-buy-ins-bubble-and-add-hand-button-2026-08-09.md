# Match backgrounds: Total Buy-Ins bubble and Add Hand button

Color-only swap, per mode. Nothing else changes.

## What changes

Dark Mode
- Total Buy-Ins bubble background becomes the Add Hand button's cream background.
- Add Hand button untouched.

Light Mode
- Add Hand button background becomes the Total Buy-Ins bubble's light amber background.
- Total Buy-Ins bubble untouched.

Text colors, borders, size, spacing, shape, typography and behavior all stay exactly as they are.

## Technical details

- `src/components/poker/SessionDetailsCard.tsx` (Total Buy-Ins `Badge`): replace `dark:bg-amber-950/50` with the cream token used by the `lightyellow` button variant (`dark:bg-poker-cream`). Light-mode `bg-amber-50` stays.
- `src/components/poker/HandManagementPanel.tsx` (Add Hand `Button`): keep `variant="lightyellow"` but add a class override so light mode uses `bg-amber-50` (with matching hover), while dark mode keeps the current cream background. Applied only to this button instance, so other `lightyellow` buttons are unaffected.
