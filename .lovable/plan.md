

## Update Home Screen Outlined Button Borders to Gold in Dark Mode

### What changes
All outlined buttons on the Home screen that currently use green borders (`border-poker-feltGreen`) will get gold borders in dark mode only, using Tailwind's `dark:` prefix.

### Files to edit

**1. `src/pages/Index.tsx`** — 5 buttons to update:
- Settings button (line 162): add `dark:border-poker-gold dark:text-poker-gold`
- User/Dashboard button (line 170): same
- Plus button near Recent Sessions (line 249): same
- First View All button (line 257): same
- Second View All button (line 305): same

Each button currently has `className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"`. Will become:
`className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white dark:border-poker-gold dark:text-poker-gold dark:hover:bg-poker-gold"`

**2. `src/components/NotificationBell.tsx`** — 1 button (line 13):
Same pattern — add dark-mode gold overrides to the notification bell outline button.

### What stays the same
- Light mode appearance (green outlines unchanged)
- Button backgrounds remain transparent in default state
- Layout, size, functionality untouched
- Hover fill changes to gold in dark mode to match the new border color

