

## App-Wide Premium Dark Mode — Implementation Plan

### Overview
Build a complete dark mode with deep charcoal surfaces, warm gold accents, and premium poker atmosphere. User-controlled via Settings toggle. No layout/logic changes.

### Phase 1: Theme Infrastructure (2 files)

**New: `src/context/ThemeContext.tsx`**
- React context with `theme` state (`light` | `dark`) and `toggleTheme`
- Reads/writes `localStorage('theme')`
- Toggles `.dark` class on `document.documentElement`
- Initializes from localStorage on mount (default: light)

**Update: `src/main.tsx`**
- Wrap `<App />` in `<ThemeProvider>`

### Phase 2: Premium Dark Palette (1 file)

**Update: `src/index.css` — rewrite `.dark` block**

```text
Background:         0 0% 7%          (#121212)
Foreground:         40 10% 95%       (#F5F3EF warm white)
Card:               0 0% 11%        (#1C1C1C)
Card-foreground:    40 10% 95%
Popover:            0 0% 13%        (#212121)
Primary:            43 77% 52%      (gold — KEEP)
Primary-foreground: 0 0% 7%        (dark on gold)
Secondary:          144 54% 20%     (darker felt green)
Muted:              0 0% 15%       (#262626)
Muted-foreground:   40 5% 55%      (warm gray)
Accent:             0 0% 15%
Border:             0 0% 18%       (#2E2E2E)
Input:              0 0% 18%
Destructive:        0 62% 45%
Ring:               43 77% 52%     (gold ring)
```

Also add dark-mode shadow overrides and autofill color overrides.

### Phase 3: Enable Toggle (1 file)

**Update: `src/components/settings/AppSettings.tsx`**
- Import `useTheme` from ThemeContext
- Remove `disabled` from Switch, wire to `toggleTheme`
- Remove "Coming soon" text

### Phase 4: Dark-Aware Classes Across Components (~50 files)

The strategy: add `dark:` variant classes alongside existing hardcoded colors. This is the bulk of the work.

**Pattern replacements applied systematically:**

| Light class | Added dark variant |
|---|---|
| `bg-gray-50` | `dark:bg-background` |
| `bg-white` | `dark:bg-card` |
| `bg-gray-100` | `dark:bg-muted` |
| `bg-gray-200` | `dark:bg-muted` |
| `text-gray-900` | `dark:text-foreground` |
| `text-gray-800` | `dark:text-foreground` |
| `text-gray-700` | `dark:text-gray-300` |
| `text-gray-600` | `dark:text-gray-400` |
| `text-gray-500` | `dark:text-muted-foreground` |
| `text-gray-400` | `dark:text-gray-500` |
| `border-gray-*` | `dark:border-border` |
| `shadow-sm/md` | `dark:shadow-black/20` |
| `hover:bg-gray-100` | `dark:hover:bg-muted` |
| `divide-gray-*` | `dark:divide-border` |

**Files to update (grouped):**

**Pages (~15):** Index, Dashboard, PlayerDashboard, CoachDashboard, SessionHistory, SessionDetail, SessionForm, LiveSession, EditSession, ConfirmSession, Settings, Subscription, Notifications, AddPastSession, PlayerProfile, CoachProfile, ChartsLibrary, auth pages (Login, Signup, ForgotPassword, ResetPassword), legal pages

**AppLayout:** `bg-gray-50` → `bg-gray-50 dark:bg-background`

**Components (~35):** SessionCard, ActiveSessionCard, StatsQuickView, FilterBar, NewSessionButton, Logo, NotificationBell, MyStatisticsSection, DonationCard, EndSessionSheet, all poker/* components (TableCard, HandsList, SessionDetailsCard, HandForm, CardSelector, PastSessionForm, etc.), all coaching/* components, all notes/* components, all settings/* cards, ui/PremiumBanner, ui/PremiumFeatureDialog

### What stays unchanged
- All layout, spacing, navigation, routing
- Business logic and data flow
- Gold/green branding (preserved and enhanced in dark mode)
- Component structure — no moving or restructuring

### Scope
~55 files total. 2 new files (ThemeContext, none else), ~53 edits. All changes are class additions (`dark:` variants) or CSS variable updates — no logic changes.

