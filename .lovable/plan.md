# Active Session Card — Replace Location with Table Count

In `src/components/ActiveSessionsList.tsx` (lines 50–59), replace the duplicate location row with a table count.

## Change

Remove:
```tsx
<Icon name="MapPin" size={14} />
<span>{session.location || 'N/A'}</span>
```

Replace with:
```tsx
<Icon name="MapPin" size={14} />
<span>Total Tables: {session.tables?.length ?? 0}</span>
```

Keep the Clock + duration block unchanged on the same row.

## Out of scope
- Top bold session name (line 48) — unchanged.
- NLH | Cash row, Resume/Delete buttons — unchanged.
- `ActiveSessionCard.tsx` (different component, not used in this list).
