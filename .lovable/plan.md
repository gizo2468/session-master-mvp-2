# Live table: reliable auto-deal + 3 UI fixes

## 1. Auto-deal never stops on its own
- Confirmed cause: the background loop waits after a hand, then quits if the table changed meanwhile. Heartbeats (every 10s) change the table, so the loop quits and nothing restarts it.
- New approach: the table remembers *when* the next thing should happen:
  - hand ends + Auto-deal ON -> `next_deal_at = now + 3s`
  - bot's turn -> `bot_act_at = now + 0.6-1.5s`
- New `tick` command: every open device (coach and students) sends it when one of those times is due; heartbeats also run it. The server checks the time and acts once; duplicate ticks are ignored (version check + the existing atomic deal).
- Heartbeats only update "last seen" and never cancel a scheduled deal or bot move.
- Opening menus, Hand History or dialogs has no effect on the game.
- When auto-deal can't deal, the table shows why: "Auto-deal waiting: 1/2 players ready" (EN/HE).
- The background loop stays as a speed-up only; the stored schedule + ticks are the source of truth.

## 2. Deal next hand button
- Auto-deal ON: outline, faded, disabled.
- Gold and active only when Auto-deal is OFF and no hand is running.

## 3. Coach controls sheet
- Remove the duplicate inner "Coach controls" title.

## 4. Folded cards stay visible to their owner
- Fold animation unchanged.
- After folding, your own cards stay on your seat at ~35% opacity, slightly smaller and tilted, with a "Folded" label, until the hand ends. Same for the coach's own seat; in God view the coach sees every folded player's cards this way.
- Other players never get a folded player's cards; they only see card backs disappear (enforced by the server, which already sends hole cards per viewer).

## Technical details
- `engine.ts`: add `next_deal_at`, `bot_act_at` to state; helpers `scheduleNext(state, now)`, `dueAction(state, now)`. Unit tests: schedule set on hand end/bot turn, not due early, heartbeat-only update keeps schedule.
- `index.ts`: add `tick` cmd (any participant); heartbeat writes `last_seen` then runs the same due-check; `runAuto` re-reads and continues instead of returning on version change.
- `useTrainingTable.ts`: timer that fires `tick` at the earliest of `next_deal_at`/`bot_act_at` (+ small jitter), re-armed on each state update.
- `TableSeat.tsx`/`TableFelt.tsx`: render faded hole cards when folded and cards are known to this viewer.
- `TrainingTable.tsx`/`CoachControls.tsx`: button style, duplicate title, waiting reason.
- Verify: deno tests + a simulated 10-hand run with interleaved heartbeats. Signed-in play remains for you to test.
