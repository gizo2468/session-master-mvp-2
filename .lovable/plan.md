## Dashboard Header Color Update

In `src/pages/Dashboard.tsx`, change the welcome heading and role line to the Resume-button green (`green-600`).

### Changes
- **Welcome heading** (line ~111): swap `text-foreground` → `text-green-600` on the `<h2>` "Welcome, {username}!".
- **Role line** (line ~113): change the wrapping `<p>` from `text-gray-600 dark:text-gray-400 dark:text-gray-500` → `text-green-600` so both "Role:" and the role value render in the same brand green. Font weight stays as-is (semibold on the value).

### Scope
- Single file: `src/pages/Dashboard.tsx`.
- No other styling, layout, or data changes.
