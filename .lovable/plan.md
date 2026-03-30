

## Change All Header Back Buttons to Gold in Dark Mode Only

### What
Add `dark:text-primary` to all top-bar back/navigation buttons so they turn gold in dark mode while keeping green in light mode.

### Files and changes (13 locations across 12 files)

| File | Line | Change |
|---|---|---|
| `src/pages/Dashboard.tsx` | 96 | `text-poker-feltGreen` → `text-poker-feltGreen dark:text-primary` |
| `src/pages/SessionHistory.tsx` | 86 | Same |
| `src/pages/ConfirmSession.tsx` | 200 | Same |
| `src/pages/PlayerProfile.tsx` | 398 | `text-poker-feltGreen hover:text-poker-feltGreen/80` → add `dark:text-primary dark:hover:text-primary/80` |
| `src/pages/PlayerDashboard.tsx` | 66 | `text-poker-feltGreen` → add `dark:text-primary` |
| `src/pages/ConnectCoach.tsx` | 76 | Same |
| `src/pages/CoachStudentDetail.tsx` | 40 | Same |
| `src/pages/CoachSessionReview.tsx` | 302, 335 | Same (two locations) |
| `src/pages/SimpleSettings.tsx` | 80 | `text-poker-feltGreen` → add `dark:text-primary`, hover → `dark:hover:text-primary/80` |
| `src/pages/Notifications.tsx` | 435, 444 | Add `dark:text-primary dark:border-primary dark:hover:bg-primary dark:hover:text-white` |
| `src/components/poker/SessionDetailHeader.tsx` | 59 | Add `dark:text-primary` |
| `src/components/poker/LiveSessionHeader.tsx` | 15 | Add `dark:text-primary` |
| `src/components/poker/PastSessionForm.tsx` | 332 | Add `dark:text-primary` |
| `src/pages/legal/PrivacyPolicy.tsx` | 19 | Add `dark:text-primary dark:hover:text-primary/80` |
| `src/pages/legal/TermsOfUse.tsx` | 19 | Same |
| `src/pages/legal/CookiePolicy.tsx` | 19 | Same |

Help.tsx already uses `text-primary` — no change needed.

### Scope
- Dark mode only color change — light mode stays green
- No layout, spacing, or behavior changes
- ~16 class string edits across 15 files

