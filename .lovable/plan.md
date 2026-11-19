# Smarter bots: Custom ranges + GTO mode, and exact replay stacks

Cards stay randomly dealt; scenario presets remain optional.

## What the coach gets
- **Bot mode per bot seat** (wizard seats step, and Seat menu while the lesson is paused): Style (current behaviour), Custom ranges, or GTO.
- **Range editor** (full-screen sheet, works on phones):
  - 13x13 grid (pairs diagonal, suited above, offsuit below), tap or drag to paint, pinch to zoom, live "% of hands".
  - Mixed frequencies per hand (e.g. AJo 60% raise / 40% fold), each action its own colour; a frequency brush picks the split.
  - Tabs for position (UTG, HJ, CO, BTN, SB, BB) and situation: Open (RFI), vs Open (fold/call/3-bet), vs 3-bet (fold/call/4-bet), BB defense.
  - Presets: Standard 6-max, Tight, Loose. Paste/copy range text ("22+, A2s+, KTs+, AJo+").
  - Save as named template; load templates in future lessons.
- **GTO mode**: built-in preflop charts by position/situation, adjusted for stack depth and player count; balanced postflop play (see technical section). Custom-range bots use the same postflop logic.
- **Transparency**: in God view and in replays the coach sees, per bot action, the mode/range used (e.g. "GTO · BTN RFI · raise 70%"). Students never see this, unless the coach ticks "Reveal bot ranges" when publishing a summary.

## Replay stacks fix
Each hand saves every player's real starting stack, so replays are exact even after manual stack changes. Older hands keep the current estimate.

## Technical details
- **DB migration**
  - `training_range_templates` (coach_id, name, game_type, ranges jsonb) — coach-only RLS, grants to authenticated/service_role.
  - `training_lesson_participants`: add `bot_mode text` ('style'|'ranges'|'gto', default 'style'), `bot_ranges jsonb`, `range_template_id uuid`. Participants' bot_ranges hidden from students via a coach-only view/RPC (students read seats through existing policies, so ranges move to a separate `training_bot_configs` table with coach-only RLS instead of columns, if column-level hiding is impractical — chosen: separate table).
  - `training_hands.starting_stacks jsonb`; extend `commit_training_deal` to write it.
  - `training_hand_actions.bot_meta jsonb` (mode, situation, frequencies). Read restricted: students get it only via summary `reveal_bot_ranges` flag (new boolean on `training_lesson_summaries`) through a security-definer RPC.
- **Edge function** (`training-table/`)
  - New pluggable `strategy/` module: `Strategy` interface `decide(ctx) -> {action, amount, meta}`; implementations `styleStrategy` (wraps current bots.ts), `rangeStrategy`, `gtoStrategy`. A single registry picks by seat mode — later swappable for an external solver.
  - `ranges.ts`: range text parser/serializer, 169-hand keys, frequency sampling with crypto randomness.
  - `gtoCharts.ts`: baseline 6-max 100bb charts, scaled tighter for more players / shorter stacks; push/fold under ~15bb.
  - `postflop.ts`: hand strength + equity estimate (Monte Carlo vs range-weighted opponent hands, capped iterations), board texture, position, SPR, sizes 33/75/125%, bluff ratio = bet/(pot+2·bet), MDF defense, blocker-based bluff choice; PLO uses simplified version.
  - Bot configs loaded with service role at lesson start/tick; `bot_meta` written with each bot action.
  - Tests: range parser, frequency sampling, chart lookups, MDF/bluff ratio, 300 simulated hands per mode without illegal actions.
- **Frontend**
  - `trainingLab/ranges/RangeMatrix.tsx`, `RangeEditorSheet.tsx`, `rangePresets.ts`, `rangeText.ts` (shared format with edge function), hook `useRangeTemplates.ts`.
  - Wizard seats step and SeatMenu: mode selector + "Edit ranges".
  - Replayer/God view: small bot-meta chip on actions; replay uses `starting_stacks` when present.
  - Wrap-up: "Reveal bot ranges" toggle.
- AGENTS.md: rule for pluggable strategy module and coach-only bot configs.
