

## Fix Loading Logic, Data Bugs, and UX Issues on Home Screen

### 1. Splash Screen Overlay Until Data is Ready

**Problem**: Dashboard renders with skeleton placeholders, causing visual "jumps" as data loads.

**Fix**: Add a splash screen overlay to `Index.tsx` that covers the page until both `sessionsLoading` and `statsLoading` from `useUnifiedSessionStats` are complete. The splash uses the existing `Logo` component with a spinner (matching the uploaded screenshot). Fade-out with a CSS opacity transition (300ms) once all data is ready.

**Files**: `src/pages/Index.tsx`
- Import `useUnifiedSessionStats` and track its `isLoading` state
- Add a splash overlay `div` (fixed, full-screen, white bg, z-50) that renders when `isLoading || sessionsLoading`
- Apply `transition-opacity duration-300` and toggle `opacity-0 pointer-events-none` when data is ready
- Use a small delay (200ms) after data ready before removing from DOM to allow fade animation

### 2. Fix Average Duration Calculation (DB Function)

**Problem**: The DB function `get_unified_session_statistics` calculates duration as `EXTRACT(epoch FROM (end_time - start_time)) / 3600.0` but ignores the `session_duration` column (stored in seconds). When users manually edit duration, the DB function still uses raw timestamps, producing incorrect averages like "49.1h".

**Fix**: New migration to update the function. Change `duration_hours` to prioritize `session_duration`:

```sql
CASE 
  WHEN s.session_duration IS NOT NULL AND s.session_duration > 0
  THEN s.session_duration / 3600.0
  WHEN s.end_time IS NOT NULL AND s.start_time IS NOT NULL 
  THEN EXTRACT(epoch FROM (s.end_time - s.start_time)) / 3600.0
  ELSE 0 
END as duration_hours
```

This aligns with the documented architecture where `session_duration` is the source of truth when set.

**Files**: New migration in `supabase/migrations/`

### 3. Fix Total Hands Count

**Problem**: `hands_count` only counts rows in `session_hands_new` (individually logged hands). But sessions also have a `hands_played` field on the session itself (or on tables) for bulk-entered hand counts.

**Investigation needed**: Check if `sessions` or `session_tables` has a `hands_played` column. The fix will update the DB function to also sum any bulk hand counts from the session/table level, not just individually logged hands from `session_hands_new`.

**Fix in same migration**: Update `hands_data` CTE or add a fallback to session-level `hands_played` field. If sessions have `hands_played` stored, use `GREATEST(session_hands_new count, session.hands_played)` or sum both sources appropriately.

### 4. Toast Notification Repositioning

**Problem**: "Login successful" toast overlaps the top navigation icons.

**Fix**: Set `position="bottom-center"` on the Sonner `<Toaster>` in `src/components/ui/sonner.tsx`. This moves all toasts to the bottom of the screen, away from navigation controls.

**Files**: `src/components/ui/sonner.tsx`

### 5. Layout Stability (Prevent Skeleton Jump)

**Problem**: Stats and Active Sessions sections shift layout when loading finishes.

**Fix**: With the splash screen overlay (item 1), skeletons are hidden behind the splash, so the user never sees the jump. As an additional safeguard, give the `StatsQuickView` loading skeleton a `min-h` matching the rendered stats card height (~220px) to prevent layout shift if the splash is bypassed.

**Files**: `src/components/StatsQuickView.tsx` — add `min-h-[220px]` to the loading skeleton container.

---

### Summary of Changes

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Add splash screen overlay with fade-out |
| `src/components/ui/sonner.tsx` | Set `position="bottom-center"` |
| `src/components/StatsQuickView.tsx` | Add min-height to loading skeleton |
| New migration `.sql` | Fix `average_duration` to use `session_duration` field; fix `hands_count` to include bulk hand counts |

