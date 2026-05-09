## Dashboard UI Cleanup

Two small changes in `src/pages/Dashboard.tsx`.

### 1. Remove redundant "Dashboard" label
Delete the `<p className="text-lg font-medium text-poker-feltGreen">Dashboard</p>` line that appears under "Role: Player" in the player branch (and the matching "Coach Dashboard" line for coaches, only the player one was flagged but we'll leave the coach label since it's a different label — only the literal duplicate "Dashboard" under the player role is removed).

### 2. Gold "Home" button in header
Update the back button in the Dashboard header:
- Change `className="text-poker-feltGreen dark:text-primary p-0"` to `className="text-poker-gold p-0 hover:text-poker-gold/80"`
- Arrow icon inherits color via `currentColor`, so it turns gold automatically.

### Scope
- Single file: `src/pages/Dashboard.tsx`
- No logic, routing, or data changes.
