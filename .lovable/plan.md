## Dashboard Header — Use Primary Brand Green

In `src/pages/Dashboard.tsx`, replace the bright `text-green-600` applied previously with the app's primary brand green token `text-poker-feltGreen` (#35654D, used throughout the app for main UI accents like back buttons).

### Changes
- **Welcome heading** (`<h2>` "Welcome, {username}!"): `text-green-600` → `text-poker-feltGreen`.
- **Role line** (`<p>` "Role: …"): `text-green-600` → `text-poker-feltGreen`.

### Scope
- Single file: `src/pages/Dashboard.tsx`. No other layout, weight, or data changes.