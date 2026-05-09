## Dashboard Welcome Message Update

In `src/pages/Dashboard.tsx`, update the welcome heading:

### Changes
- **Text color**: change `text-primary` (gold) → `text-foreground` so it renders black in light mode (and remains readable in dark mode per the theme).
- **Data source**: replace `{user.fullName || user.username}` with `{user.username || user.fullName}` so the username takes priority. Keep `fullName` as a fallback in case a user has no username set.

### Scope
- Single file: `src/pages/Dashboard.tsx`, line ~111.
- No other styling, layout, or data changes.
