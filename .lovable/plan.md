

## Add "Reset Onboarding" Row to Settings

### Problem
The previous turn added a Reset button inside `src/components/settings/AppSettings.tsx`, but that component is not imported anywhere — the live Settings page (`src/pages/Settings.tsx`) renders General Settings inline. So no button is visible to the user.

### Fix
Add a new row inside the existing **General Settings** card in `src/pages/Settings.tsx`, matching the style of the surrounding rows (icon on the left, label + helper text, control on the right).

### Row design
- Icon: `RotateCcw` (lucide), styled like neighboring icons: `h-5 w-5 text-gray-500 dark:text-poker-gold dark:drop-shadow-[0_0_3px_rgba(212,175,55,0.4)]`
- Label: "Reset Onboarding"
- Helper: "Replay the Start Session hint on Home"
- Action: outline `Button` with `RotateCcw` icon + "Reset" label
- On click:
  - `localStorage.removeItem('onboarding_start_session_seen')`
  - Show toast: "Onboarding reset" / "The hint will appear next time you visit Home."

### Placement
Inside the General Settings card's `space-y-4` container, added as the last row after Dark Mode (around line 591).

### Files to edit
1. **`src/pages/Settings.tsx`** — add the new row inside the General Settings card. No new imports needed beyond what's already there (`Icon`, `Button`, `useToast` are all imported).

### Cleanup (optional, included)
2. **`src/components/settings/AppSettings.tsx`** — leave as-is since it's an unused dormant file and removing it is out of scope for this request. No change.

### What stays unchanged
- Layout, spacing, and styling of all existing rows
- The OnboardingHint component itself
- localStorage key name (`onboarding_start_session_seen`)

