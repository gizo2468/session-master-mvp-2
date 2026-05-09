## Goal

Make **Session Name** and **First Table Name** two independent fields. The session label flows to history/details views; the first table label flows to the active table/live view.

## Changes — `src/pages/SessionForm.tsx`

### Schema & defaults
- Add `firstTableName: z.string().optional()` to the Zod schema.
- Add `firstTableName: ''` to `useForm` defaults.

### UI
- Inside `Advanced Options` (`<CollapsibleContent>`), above the new `Festival Name` field, add a `First Table Name (Optional)` input:
  - Label: `First Table Name` with muted `(Optional)` suffix
  - Placeholder: `e.g., Main Event, Table 5`
  - Helper text under it: `Leave blank to use the Session Name for this table.`

### onSubmit logic
Currently both the session and the initial table are set from `values.location`. Update so:

```
const sessionLabel = values.location?.trim() || '';
const tableLabel = values.firstTableName?.trim() || sessionLabel;
```

- `initialTable.name` and `initialTable.location` → `tableLabel`
- `newSession.location` → `sessionLabel` (unchanged behavior)
- `newSession.tableName` → `tableLabel` (was `values.location`)

This ensures `session.location` (used by SessionCard / SessionDetail / history) shows the **Session Name**, and the first table row (used by Live Session active table display via `tables[0].name`) shows the **First Table Name** — falling back to the session name only if the user leaves it blank.

## Out of scope

- No DB migration. `sessions.table_name` and `session_tables.table_name` columns already exist; we just stop overwriting them with the session name.
- No changes to history, live session, or session detail components — they already read from the correct fields.
- The Festival Name field added in the prior task is preserved.

## Files touched

- `src/pages/SessionForm.tsx` (only)
