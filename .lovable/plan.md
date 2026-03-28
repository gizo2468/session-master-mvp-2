

## Fix Settings Page Dark Mode Colors

Two issues on `src/pages/Settings.tsx`:

1. **Line 277** — Title uses `text-poker-black` which stays dark on dark backgrounds. Change to `text-poker-black dark:text-white`.

2. **Line 271** — Back button uses `text-poker-feltGreen` and hover `text-poker-green`. Change both to gold: `text-primary dark:text-primary` and hover `hover:text-primary/80`.

Single file, two line changes. No layout or behavior changes.

