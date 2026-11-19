# Training Lab – Live multiplayer table (game engine + live sync)

The goal is a live table that actually plays. The coach starts a lesson, students join from their own devices, and real hands are dealt and played against each other, bots and coach-controlled seats. The server decides everything. The table is laid out cleanly so the game logic can be tested; visual polish and animations come in your next step.

## What users will see

**Coach**
- **Start lesson** button on each draft or paused lesson (in the list and in the wizard review). It opens the live table at `/training-lab/table/:lessonId`.
- The **Live** tab shows a **Return to table** button on every live or paused lesson.
- Control bar:
  - Pause / Resume / End lesson; Deal next hand; Auto-deal on/off
  - Action timer: off / 15s / 30s / 60s
  - God view: see every player's hole cards
  - Pause & discuss: freezes the table for everyone and shows the coach's message as a banner
  - Quick note: attach a note to the current hand or to the last action
- Seat menu (between hands):
  - Adjust stack
  - Add or remove a student or bot
  - Change a bot's style
- Next-hand presets: hole cards per seat, board, stacks, dealer button.
- Acts for coach-controlled seats using the same action buttons as students.

**Student**
- As soon as a lesson goes live, students get a notification and the "Join table" banner. The button opens the same table.
- They see only their own hole cards. Action buttons appear only on their turn: Fold, Check, Call, Bet, Raise, All-in.
  - Bet slider and quick sizes: 2.2x / 2.5x / 3x preflop; 1/3, 1/2, 2/3, pot, all-in postflop.
- The table shows:
  - Stacks, bets, pot and board
  - Dealer button and position labels (UTG … BTN, SB, BB)
  - A ring showing whose turn it is and how much time is left
  - Connected seats; students not connected show "Waiting…"
- Reloading the page restores the full table and the player's own cards at once.

The table area is always laid out left to right, also in Hebrew. Controls and messages follow the user's language (EN/HE).

## How it works

```text
 Client (coach / student)                    Edge Function "training-table"
  ├─ subscribes to lesson state  ◄── realtime ── writes public table state
  ├─ fetches own hole cards (protected)          ├─ shuffle (crypto), deal, blinds/ante
  └─ sends actions ─────────────────────────────►├─ validates seat, turn, legal amount
                                                  ├─ side pots, showdown (pokersolver)
                                                  ├─ bots act server-side (0.6–1.5s delay)
                                                  └─ logs every action / hole cards
```

## Database additions
- **`training_table_state`** (one row per lesson): the public state everyone can see. It holds:
  - Hand number, street, board, pots, current bets
  - Whose turn it is, turn deadline, last action
  - Paused flag and "discuss" message
  - Settings: auto-deal, timer, god-view
  - Pending next-hand presets
  - A state version number

  Coach and seated students can read it; only the server writes it. Live updates turn on for it.
- **`training_hand_secrets`**: the remaining deck for each hand. No user can ever read it, only the server.
- **Existing tables used as planned:**
  - Every action goes to `training_hand_actions`.
  - Hole cards go to `training_hand_private_cards` (only the player and the coach can read them).
  - Cards shown at showdown are written as public "show" actions.
- **Presence:** the live channel tracks who is connected to the table, which drives the "Waiting…" seats.
- **Notifications:** when a lesson goes live, the server sends a `training_lesson_live` notification to each seated student. The existing notification triggers already send these as push notifications. Notifications get a link to the lesson so tapping opens the table.

## Server engine (Edge Function `training-table`)
- **Security:** every request checks the user's sign-in. Coach-only commands check that the caller owns the lesson. Player actions check that the seat belongs to the caller and that it's their turn.
- **Commands:**
  - Lesson: `start`, `pause`, `resume`, `end`
  - Hands: `deal`, `act`, `timeout`
  - Coach settings: `set_settings`, `set_preset`, `discuss`
  - Seats: `adjust_stack`, `seat_change`
  - Notes: `note`
- **Game rules:**
  - Cards: crypto-secure shuffle. Presets apply first; the remaining cards are dealt randomly from what's left of the deck.
  - Betting:
    - Blinds and ante; heads-up rules (the dealer posts the small blind)
    - Turn order and minimum raise
    - An all-in raise that is less than a full raise does not reopen betting for players who already acted.
  - Hand ending:
    - Side pots and split pots
    - When everyone left is all-in, the remaining board is dealt out.
    - A hand ends early when everyone else folds.
    - Hands are compared with `pokersolver` (Omaha rules for PLO: exactly 2 hole cards + 3 board cards). PLO bets are capped at pot size.
- **Bots:**
  - Each style has its own preflop opening ranges by position.
  - After the flop, decisions use hand strength, draws and pot odds, plus some randomness.
  - Bots act after 0.6–1.5s and keep acting until a human's turn comes up.
  - This runs in the background after the server has already answered, so the table is never held up.
  - Bot actions are logged like any player's.
- **Timer:** the deadline is saved in the table state. When it passes, any connected client asks the server to apply a timeout. The server checks the deadline and auto-checks or auto-folds that player.
- **Auto-deal:** the next hand starts automatically a few seconds after a hand ends (also run in the background on the server).
- **Updates:** every change increases the state version number. Clients ignore updates older than the version they already have, so the table stays consistent.

## Files
- `supabase/functions/training-table/index.ts` handles requests. The engine is split into `engine.ts` (betting, pots, showdown), `bots.ts` and `deck.ts` in the same folder.
- New `src/pages/TrainingTable.tsx` plus parts in `src/components/trainingLab/table/`:
  - Table and seat display, action bar, coach control bar
  - Presets dialog, note dialog, discuss banner
- New hook `useTrainingTable.ts`: live subscription, own-card fetching, presence and commands sent to the server.
- Updated:
  - The lessons list and the Live tab (Start / Return to table)
  - Student cards: "Join table" opens the real table
  - The notification screen: routing for the new lesson-live notification

## Testing
- Server-side tests for the engine:
  - Side pots with 3 all-ins
  - Split pot
  - Minimum raise; a short all-in that doesn't reopen betting
  - Heads-up blind order
  - Presets applied without duplicate cards
  - Street progression when everyone is all-in
- A real end-to-end check (signed in) isn't possible here, because the Supabase project is user-managed. You'll need to try a lesson with a student on a second device.
