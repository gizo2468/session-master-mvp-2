# Active Session Card — Compact Bottom Row

In `src/components/ActiveSessionsList.tsx`, restructure the inner card body (currently lines 50–64).

## Change

- Remove the entire middle row that currently holds MapPin "Total Tables" + Clock duration (lines 50–59).
- Append the Clock icon + duration onto the existing NLH | Cash row, separated by an em dash.

Resulting markup for that block:
```tsx
<div className="flex items-center gap-3 text-sm">
  <span className="text-gray-600 dark:text-gray-400">{session.gameType || 'N/A'}</span>
  <span className="text-gray-400 dark:text-gray-600">|</span>
  <span className="text-gray-600 dark:text-gray-400">{session.format || 'N/A'}</span>
  <span className="text-gray-400 dark:text-gray-600">–</span>
  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
    <Icon name="Clock" size={14} />
    <span>{formatDuration(session.startTime)}</span>
  </div>
</div>
```

## Out of scope
- Top session-name row, Resume/Delete buttons, container styling — unchanged.
- Note: the "Total Tables" line added previously will be dropped per this request.
