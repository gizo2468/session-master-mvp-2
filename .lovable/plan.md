## Goal

In the Live Session view, the Session Details card should be **titled with the Session Name**, no longer show a "Playing From" row, and never inherit the online site as its title. The Active Table card already pulls from `tables[0].name` (the First Table Name) — no change needed there.

## Change — `src/components/poker/SessionDetailsCard.tsx` (only file)

1. **Card title** — replace the static "Session Details" with the session name:
   ```tsx
   <CardTitle className="text-lg font-medium text-center">
     {session.location?.trim() || 'Session Details'}
   </CardTitle>
   ```
   Pulled strictly from `session.location` (Session Name). `physicalLocation` (online site) is never used as the title.

2. **Remove both "Playing From" rows** — delete the entire block at lines 82–99 (both the offline `Playing From:` row and the online `Online Game – Played from:` row). The card now starts with `Game Type`.

That's it. The Active Table card (`Active Tables` list) renders `table.name`, which since the prior fix is sourced from the independent `firstTableName` field with its own `Table 1` fallback — no overlap.

## Out of scope

- No DB changes, no form changes (Session Name and First Table Name are already independent).
- No changes to the Active Tables component.
- Online site / `physicalLocation` data remains stored on the session for filtering/history, just not displayed in this card.

## Files touched

- `src/components/poker/SessionDetailsCard.tsx` (only)
