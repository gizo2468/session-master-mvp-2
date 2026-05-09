## Plan

1. Update the `LiveSession` data handoff so `SessionDetailsCard` receives the original session object without overriding `location` with `tableName`.
2. Keep `SessionDetailsCard` bound only to `session.location`, which already represents the Session Name entered on the Home/start screen.
3. Leave the Active Tables area bound to each table’s own title (`table.location` / first table label), so the First Table Name continues to appear there independently.
4. Validate the mapping path end-to-end against the existing session creation logic in `SessionForm`, where:
   - `location` = Session Name
   - `tableName` / initial table `location` = First Table Name or `Table 1`

## Expected result

- **Session Details** shows the Session Name exactly as entered on the Home screen.
- **Session Details** no longer shows the First Table Name by mistake.
- **Active Tables** continues showing the First Table Name.
- The two labels only match when the user intentionally typed the same text in both inputs.

## Technical details

Relevant files:
- `src/pages/LiveSession.tsx` — remove the incorrect `location: currentSession.tableName || currentSession.location` override.
- `src/components/poker/SessionDetailsCard.tsx` — keep rendering from `session.location` only.
- `src/pages/SessionForm.tsx` — no behavior change needed; it already creates separate session and table values.