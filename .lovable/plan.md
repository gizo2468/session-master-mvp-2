## Goal

Fully decouple Session Name and First Table Name. Each has its own independent fallback — neither ever borrows from the other.

## The bug

In `src/pages/SessionForm.tsx` `onSubmit`, the current logic is:

```ts
const sessionLabel = values.location?.trim() || '';
const tableLabel = values.firstTableName?.trim() || sessionLabel; // ← borrows from session
```

So when the user fills only the Session Name, the first table inherits it, producing the duplicate display in the screenshot.

## Fix — `src/pages/SessionForm.tsx` only

Replace the fallback logic with two independent defaults:

```ts
const today = new Date();
const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
// e.g. "May 9"

const sessionLabel = values.location?.trim() || `Session ${monthDay}`;
const tableLabel   = values.firstTableName?.trim() || 'Table 1';
```

Then:
- `initialTable.name` = `tableLabel`
- `initialTable.location` = `tableLabel`
- `newSession.location` = `sessionLabel`
- `newSession.tableName` = `tableLabel`

No other files need changes — `SessionCard` / `SessionDetail` already read `session.location`, and the Active Tables view already reads `tables[0].name`. They just need the form to stop crossing the streams.

## Out of scope

- No DB changes.
- No edits to display components.
- Festival Name and other fields untouched.

## Files touched

- `src/pages/SessionForm.tsx` (only)
