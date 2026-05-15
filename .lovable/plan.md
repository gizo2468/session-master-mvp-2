# Resume Live Session — Fix Plan

## Root cause

`session_hands_new` has **two duplicate foreign keys** pointing at `sessions(id)`:

- `fk_session_hands_session_id`
- `session_hands_new_session_id_fkey`

(verified via `pg_constraint`)

PostgREST refuses to embed `session_hands_new(*)` when more than one FK is found and returns error code `PGRST201` ("more than one relationship was found"). Every fetcher in the project that talks to `session_hands_new` already disambiguates the FK with `session_hands_new!fk_session_hands_session_id(...)`.

**The Resume path uses one fetcher that does NOT disambiguate:** `src/hooks/useSessionLoader.ts` (lines 51–58):

```ts
.from('sessions')
.select(`
  *,
  session_tables(*),
  session_hands_new(*)        // ← ambiguous embed, 400 error
`)
.eq('id', id)
.maybeSingle();
```

### Why this triggers on Resume specifically

When the user taps Resume, `useActiveSessionRecovery.resumeSession` navigates to `/session/:id`. `useSessionLoader` mounts immediately. On the first render the session context's `sessions` array can still be empty (or `activeSession` may point to the *other* of the two active sessions in the DB — there are currently 2 `is_active=true` rows for this user). The context lookup at lines 33–49 misses, so the hook falls through to the DB query above, which returns `PGRST201`, throws "Database error", and shows the red **Error Loading Session** toast (lines 116–122). The session is fine in the DB; the embed is what's broken.

A second active session also slows context hydration enough that this race almost always loses on Resume.

## Fix

### 1. `src/hooks/useSessionLoader.ts`

Disambiguate the embedded query to match the rest of the codebase:

```ts
.from('sessions')
.select(`
  *,
  session_tables(*),
  session_hands_new!fk_session_hands_session_id(*)
`)
```

This matches `fetchUserSessions` / `fetchActiveSession` in `src/utils/database/sessionFetcher.ts` and removes the PGRST201 failure.

### 2. (Optional, recommended) Drop the duplicate FK constraint

To prevent this class of bug from biting any future query, run a migration:

```sql
ALTER TABLE public.session_hands_new
  DROP CONSTRAINT IF EXISTS session_hands_new_session_id_fkey;
ALTER TABLE public.session_hands_new
  DROP CONSTRAINT IF EXISTS session_hands_new_table_id_fkey;
```

Both are exact duplicates of the `fk_session_hands_*` constraints (same column, same target, same `ON DELETE CASCADE`), so dropping them is safe and keeps PostgREST embeds unambiguous everywhere.

I'll only ship step 2 if you confirm — step 1 alone fixes the Resume bug.

## Verification

1. Reload the home page and tap **Resume** on the Tournament card → navigates to `/session/:id`, timer + tables + buy-ins render, no red toast.
2. Console should show `✅ Found valid session in context` (or `✅ Session loaded and converted successfully` on a cold context) with no `❌ Database error loading session` line.
