# Fix: the live table must let people actually play

## What the user will see
- **Sit in / Sitting out**: every student and coach seat has a "Sit in / I'm ready" button. Only connected and ready players are dealt in; everyone else shows "Sitting out" (no cards, no blinds, never auto-folded).
- **Coach status bar**: "Waiting for players: 1/2 ready". Auto-deal only starts when at least one human seat is ready; the coach can still press "Deal anyway".
- **Coach plays too**: an "I'm playing too" switch in the wizard (seat step) and on the table, with a seat picker. With a seat the coach gets the same action bar as students; without one a top banner reads "You're watching as coach".
- **"You are playing" is obvious**:
  - Your seat is always rotated to bottom-centre, larger, labelled "YOU", with big face-up cards.
  - On your turn: a gold glow, a "Your turn" banner, a short sound and a vibration, and the action bar slides up. The action bar is fixed to the bottom of the screen above the coach controls, so it's never hidden on mobile.
  - Otherwise: "Waiting for <name>…" plus a countdown ring on the active seat.
  - An action log showing the last 5 actions ("Bot 2 raises to 6", "Dana folds").
- **Disconnects mid-hand**: after the action timer runs out (or 30 seconds if the timer is off), the player is folded and marked sitting out until they come back.

## Technical details
- **Connection tracking on the server** (the server can't read browser presence directly):
  - Each seat in `training_table_state` gets `ready`, `sitting_out` and `last_seen`.
  - New `heartbeat` command: the client sends it every 10 seconds while the table is open, plus when the tab regains focus. A seat counts as connected if `last_seen` is within the last 25 seconds.
  - New `sit_in` / `sit_out` commands for the owner of the seat, or the coach for any seat.
- **Engine (`startHand`)**: a seat is `in_hand` only if it's a bot, or a human seat that is ready, not sitting out, and connected. Blinds and the dealer button skip seats that aren't dealt in. Tests added for this.
- **`runAuto` and `timeout`**:
  - Bots act only when `seat.type === 'bot'`. This is checked again right before the move is saved.
  - `timeout` acts only for a connected or ready human seat whose deadline has passed. For a disconnected seat, it waits until the deadline (timer value, or 30 seconds if the timer is off), then folds the seat and sets `sitting_out`.
  - The server sets a disconnect deadline even when the timer is off.
  - Auto-deal requires at least one ready human seat and at least 2 seats dealt in.
- **`deal` command**: accepts `force: true` so the coach can deal anyway; seats that aren't ready still sit out.
- **Coach seat**: a new `set_coach_seat` command (seat number, or none) uses the existing seat-change path with `seat_type = 'coach'`. The wizard gets an "I'm playing too" switch plus a seat select, instead of only the coach option in the per-seat dropdown.
- **Client**:
  - `TrainingTable.tsx` is restructured: seats are rotated so "me" sits at the bottom, the status bar and banners are added, and the action bar moves to a fixed bottom sheet with z-index above the coach controls (which collapse into a drawer on mobile).
  - Turn alerts use `navigator.vibrate` plus a short WebAudio beep.
  - New `ActionLog.tsx` reads the last actions that the server keeps in state (`recent_actions`, max 5).
- All new text is in EN and HE.

## Verification
- Engine tests: sitting-out seats are not dealt and don't post blinds; a disconnected player is folded only after the deadline; bots never act for human seats.
- Re-deploy the function and run the full test suite.
- A full signed-in run with two accounts isn't possible from here, because your Supabase project is external and I can't sign in to it. I'll run simulated multi-seat hands through the function's logic and report exactly what was and wasn't verified.
