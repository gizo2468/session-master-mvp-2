

## Plan: Fix Cash Game BB/Stack Update Save Failure

### Root Cause
The `table_bb_stack_updates` table has a CHECK constraint (`exclusive_game_type`) requiring cash game rows to have `stack IS NULL AND bb IS NULL AND level IS NULL`. The recent changes store the cash stack amount in `stack`, violating this constraint.

### Solution
Two changes needed:

**1. DB Migration** — Relax the CHECK constraint to allow `stack` in cash game rows:
```sql
ALTER TABLE public.table_bb_stack_updates DROP CONSTRAINT exclusive_game_type;
ALTER TABLE public.table_bb_stack_updates ADD CONSTRAINT exclusive_game_type CHECK (
  (level IS NOT NULL AND stack IS NOT NULL AND bb IS NOT NULL AND small_blind IS NULL AND big_blind IS NULL) OR
  (small_blind IS NOT NULL AND big_blind IS NOT NULL AND level IS NULL AND bb IS NULL)
);
```
This removes only the `stack IS NULL` requirement from the cash game branch, allowing cash rows to optionally store a stack value.

**2. `src/services/bbStackUpdateService.ts`** — In `saveBBStackUpdatesBulk`, for cash game rows, parse `stack` as a float and round to integer (bigint column), and ensure `bb` stays `null`:
- Line 336: change `parseInt` to `Math.round(parseFloat(...))` for stack
- Line 337: force `row.bb = null` (already done, just confirm)

### Files changed
- New DB migration (relax CHECK constraint)
- `src/services/bbStackUpdateService.ts` (minor parse fix)

