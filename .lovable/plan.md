## Goal

Restore the "Session Details" heading and show the Session Name as a centered subtitle directly below it. Active Tables card already independently shows the First Table Name — no change needed there.

## Change — `src/components/poker/SessionDetailsCard.tsx` (only file)

Currently the CardHeader renders only `{session.location}`. Replace it with both the static heading and a centered Session Name line:

```tsx
<CardHeader className="pb-2 text-center">
  <CardTitle className="text-lg font-medium">Session Details</CardTitle>
  {session.location?.trim() && (
    <p className="text-base font-semibold text-foreground mt-1">
      {session.location.trim()}
    </p>
  )}
</CardHeader>
```

- Heading "Session Details" always visible.
- Session Name shown below, centered, only when present (no fallback to anything else — never derived from `physicalLocation` or table name).
- Active Tables card untouched; it continues to render `tables[0].name` from the independent First Table Name field.

## Out of scope

- No DB changes, no form changes.
- No edits to ActiveTables / table card components.

## Files touched

- `src/components/poker/SessionDetailsCard.tsx` (only)
