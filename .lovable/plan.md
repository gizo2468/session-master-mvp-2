## Plan — Break Time + My Notes buttons in Live Session

Add two outline buttons ("Break Time", "My Notes") stacked below the existing "BB/Stack Update" and "Upload Hand" buttons in `SessionTimerCard.tsx`, matching their exact size/shape/typography. Wire "My Notes" to the existing notes UI and add a full break-timer feature that pauses the session clock.

### 1. Database (migration)
New table `public.session_breaks` to persist each break for the Session Summary:

```
id uuid pk default gen_random_uuid()
session_id uuid not null references sessions(id) on delete cascade
user_id uuid not null   -- auth.uid()
start_time_utc bigint not null       -- ms epoch
planned_duration_seconds int not null
end_time_utc bigint                  -- null while break is active
notes text
created_at timestamptz default now()
```
- GRANT SELECT/INSERT/UPDATE/DELETE to `authenticated`; ALL to `service_role`; no anon.
- Enable RLS with policies scoped to `user_id = auth.uid()`.
- Index on `(session_id, end_time_utc)`.

### 2. New hook — `src/hooks/useSessionBreak.ts`
- Loads all rows for `session_id`, exposes `activeBreak` (row with `end_time_utc IS NULL`), `completedBreaks`, `totalCompletedBreakSeconds`, and a live `remainingSeconds` ticker for the active break.
- Actions: `startBreak(minutes, notes)`, `endBreakEarly()`, both writing to Supabase and updating local state.
- Auto-ends the break when `remainingSeconds` hits 0 (updates row's `end_time_utc = now`).
- Subscribes via a lightweight polling refresh on tab focus (no realtime channel needed).

### 3. `src/components/poker/SessionTimerCard.tsx`
- Import and use `useSessionBreak(sessionId)`.
- Compute `activeBreakSeconds` = if active, `now - start_time_utc` (capped at planned).
- Display elapsed as `rawElapsed - totalCompletedBreakSeconds - activeBreakSeconds` so the DB write and on-screen timer both exclude break time.
- While a break is active:
  - Replace the "Session Time" label with a gold "ON BREAK" pill above the digits.
  - Render a large `mm:ss` remaining countdown below the digital timer with a subtle pulse.
  - Swap the "Break Time" button for an outline "End Break Early" button (same styling).
- Add two new outline buttons inside the existing `w-fit mx-auto` column (below Upload Hand), same `variant="outline" size="sm"` classes and icons (`Coffee` for Break Time, `StickyNote` for My Notes).
- Buttons open two new modals via local state: `showBreakModal`, `showNotesModal`.

### 4. New modal — `src/components/poker/BreakTimeModal.tsx`
- Dialog with:
  - Numeric input for minutes (`type="number"`, `inputMode="numeric"`, `min=1`, `max=240`, validated).
  - Optional multiline notes textarea.
  - Primary "Start Break" button (disabled if minutes invalid/empty), Cancel button.
- On submit → `startBreak(minutes, notes)` from the hook, then closes.

### 5. New modal — `src/components/poker/MyNotesModal.tsx`
- Simple `Dialog` (mobile-friendly `max-w-md`, scrollable content) that renders the existing `<MyNotesCard />` inside. No duplication of note logic.

### 6. Session Summary display
- In `src/pages/SessionDetail.tsx`, add a new `BreaksSummarySection` component beneath `TablesPlayedSection` (visible when the session has any completed breaks) listing each break's start time, planned duration, actual duration (from `end_time_utc - start_time_utc`), and notes. Fetches from `session_breaks` for that `session_id`.

### 7. Preservation
- Do not touch Add Table, BB/Stack Update, or Upload Hand handlers/styling — only append the new buttons in the same visual group.
- All new buttons use identical `Button variant="outline" size="sm"` classes as the existing pair, guaranteeing matching width/height/typography on mobile.
- Break state is server-persisted, so returning to the Live Session (or reopening the app) recomputes `remainingSeconds` from `start_time_utc + planned_duration_seconds - now` — no reset on modal close or navigation.

### Technical notes
- Timer subtraction is applied both to the on-screen display and to `updateSessionDuration(session.id, adjustedElapsed)` so `sessions.session_duration` never counts break time.
- Auto-end race: `endBreakEarly` and the countdown auto-end both call the same `endBreakRow(id)` guarded by `if (!row.end_time_utc)`.
- No changes to any existing tables, RLS, or session logic beyond the new table and the elapsed-time subtraction.
