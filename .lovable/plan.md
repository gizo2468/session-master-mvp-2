## Goal

Make the top input represent the **Session Name** only, and add a separate optional **Festival Name** field inside Advanced Options that's stored as metadata for filtering/grouping.

## Changes

### 1. `src/pages/SessionForm.tsx`
- Rename the `location` field label from `First Table / Session Name` to `Session Name`. Update placeholder to something neutral like `e.g., Friday Cash Night` (instead of `Venue or site`).
- Add a new optional `festivalName` field to the Zod `formSchema` and `useForm` defaults.
- Inside the `Advanced Options` `<CollapsibleContent>`, after the existing checkboxes, add a new `FormField` for `festivalName`:
  - Label: `Festival Name` with a muted `(Optional)` suffix
  - Placeholder: `e.g., WSOP, EPT, or Winter Series`
- On submit, pass `festivalName` through to `startSession` (will be persisted via the new column below).

### 2. Database — add `festival_name` column

Migration on `public.sessions`:
- `ALTER TABLE public.sessions ADD COLUMN festival_name TEXT;`
- Update the `start_session` RPC to accept and persist a `p_festival_name TEXT DEFAULT NULL` parameter.

(No RLS changes — column inherits existing session policies.)

### 3. Wire-through types/services
- `src/services/sessionPersistence.ts`: add `festivalName?: string` to `SessionStartData` and pass `p_festival_name` to the RPC.
- `src/types/poker.ts` (`PokerSession`): add optional `festivalName?: string`.
- `src/utils/database/sessionConverter.ts` & `sessionFetcher.ts`: map `festival_name` ↔ `festivalName` on read/write.
- Session creation flow in `SessionForm` continues to use `location` as the session/table identifier; `festivalName` is purely metadata (no impact on dashboard naming).

## Out of scope

- No filtering UI is built yet — column is added so future filters can use it.
- `table_name` for the first table continues to default from `location` (the renamed Session Name). Per-table renaming already exists elsewhere.

## Files touched

- `src/pages/SessionForm.tsx`
- `src/services/sessionPersistence.ts`
- `src/types/poker.ts`
- `src/utils/database/sessionConverter.ts`
- `src/utils/database/sessionFetcher.ts`
- DB migration: add column + update `start_session` function
