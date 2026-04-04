

## Fix Coach > Player Profile Screen (Dark Mode)

### Changes

**1. `src/pages/PlayerProfile.tsx`** — Fix player name color and display

- **Line 414**: Change `text-poker-black` to `text-foreground` so the name is white in dark mode
- The data already shows `player.full_name` on line 415 (falls back to username), so the top line should already show the full name. The second line (417) shows `@{player.username}`. If the user sees the username twice, it's because `full_name` is empty and falls back to `player.username`. The display logic is correct — this is a data issue, not a code issue. No change needed here.

**2. `src/components/coaching/StudentSessionStats.tsx`** — Change stat values from green to white

- **Lines 129, 134, 139, 144**: Change `text-poker-feltGreen` to `text-foreground` on all four stat value elements (Total Sessions, Total Hours, Avg Length, Most Played)

### Summary
- 2 files edited
- Title color fix: `text-poker-black` → `text-foreground`
- Stat values: `text-poker-feltGreen` → `text-foreground` (4 occurrences)

