# Active Session Card — 3-Row Layout

In `src/components/ActiveSessionsList.tsx`, replace the current single info row (lines 50–59) with two rows.

## Result

Row 1 (existing, unchanged): green dot + bold session name.

Row 2 (restore): `Total Tables: N`, left-aligned, no icon.
```tsx
<div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
  Total Tables: {session.tables?.length ?? 0}
</div>
```

Row 3 (replace dash with `|`): `NLH | Cash | 🕒 36m`
```tsx
<div className="flex items-center gap-3 text-sm">
  <span className="text-gray-600 dark:text-gray-400">{session.gameType || 'N/A'}</span>
  <span className="text-gray-400 dark:text-gray-600">|</span>
  <span className="text-gray-600 dark:text-gray-400">{session.format || 'N/A'}</span>
  <span className="text-gray-400 dark:text-gray-600">|</span>
  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
    <Icon name="Clock" size={14} />
    <span>{formatDuration(session.startTime)}</span>
  </div>
</div>
```

## Out of scope
- Top name row, Resume/Delete buttons, container styling — unchanged.
