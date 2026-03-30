

## Change All Header Back Buttons to Gold Color

### What
Replace `text-poker-feltGreen` with `text-primary` on all top-bar back/navigation buttons across the app. Settings page is already done — 9 more locations need updating.

### Files and changes

| File | Line area | Current | Change to |
|---|---|---|---|
| `src/components/poker/SessionDetailHeader.tsx` | ~line 59 | `text-poker-feltGreen` | `text-primary` |
| `src/components/poker/LiveSessionHeader.tsx` | ~line 15 | `text-poker-feltGreen` | `text-primary` |
| `src/components/poker/PastSessionForm.tsx` | ~line 332 | `text-poker-feltGreen` | `text-primary` |
| `src/pages/Dashboard.tsx` | ~line 96 | `text-poker-feltGreen` | `text-primary` |
| `src/pages/SessionHistory.tsx` | ~line 86 | `text-poker-feltGreen` | `text-primary` |
| `src/pages/SimpleSettings.tsx` | ~line 80 | `text-poker-feltGreen` → `text-primary`, also fix hover |
| `src/pages/PlayerProfile.tsx` | ~line 398 | `text-poker-feltGreen` | `text-primary` |
| `src/pages/ConfirmSession.tsx` | ~line 200 | `text-poker-feltGreen` | `text-primary` |
| `src/pages/CoachStudentDetail.tsx` | ~line 40 | `text-poker-feltGreen` | `text-primary` |
| `src/pages/ConnectCoach.tsx` | ~line 76 | `text-poker-feltGreen` | `text-primary` |
| `src/pages/CoachSessionReview.tsx` | ~lines 302, 335 | `text-poker-feltGreen` | `text-primary` |
| `src/pages/legal/TermsOfUse.tsx` | ~line 19 | `text-poker-feltGreen` | `text-primary` |

### Scope
- Only back/home navigation buttons in page headers
- Does NOT change data display colors (stats, badges, status labels)
- Does NOT change auth page links (login/signup)
- No layout or behavior changes

