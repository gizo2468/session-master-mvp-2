## Prevent Active Session Card Wrapping on Long Sessions

Update `formatDuration` inside `ActiveSessionItem` in `src/components/ActiveSessionsList.tsx` so very long sessions don't push the bottom row onto two lines.

### New rule

- `hours >= 100` → render `${hours}h` (drop minutes entirely)
- `hours > 0 && hours < 100` → render `${hours}h ${minutes}m` (unchanged)
- `hours === 0` → render `${minutes}m` (unchanged)

### Belt-and-suspenders for layout

Add `whitespace-nowrap` to the timer's container span so the value can never wrap mid-string. The row already uses `flex items-center gap-3`; no other layout change is needed.

### Scope

- Single file: `src/components/ActiveSessionsList.tsx`
- No data, type, or business-logic changes
- Applies to every card in the Active Sessions list automatically