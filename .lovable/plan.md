# Polish the Training Lab table: speed, layout and hand history

Both "open items" in the brief are already done. The wizard's review step has **Save & Start**, and opening the table from a "lesson is live" notification marks it as read. No work is needed there.

## What players will see
- **Layout**
  - A real oval table: green felt with a thin gold rail.
  - On a phone held upright the oval is tall; on desktop or landscape it's wide.
  - Seats sit around the outside of the rail and never cover the felt, the board, the pot or each other. Up to 9 seats fit, and your seat is always bottom-centre.
- **Compact seats**
  - Each seat shows a circle with initials, the name, stack and position badge, plus small cards beside it.
  - Folded seats are dimmed but still readable.
  - Bets show as small chip stacks between the seat and the centre.
  - Action badges ("Raise 6BB", "Call", "Check", "Fold") pop up next to the seat instantly.
- **Animations (fast and smooth)**
  - Dealing: 150ms per card, staggered around the table.
  - Flop 250ms in total; turn and river 200ms each; card flip 200ms.
  - Chips slide into the pot in 250ms, and the pot slides to the winner in 400ms.
- **Instant feel**
  - Tapping an action shows the badge and moves your chips right away. If the server rejects the move, it snaps back and shows the error.
  - No spinners appear during play.
- **Cards and sound**
  - New original card design, with an optional 4-colour deck (clubs green, diamonds blue).
  - Sounds for dealing, check, chips and "your turn", with a mute button.
  - Both settings are remembered on the device.
- **Coach panel on mobile**: collapses into a "Coach" button that opens a bottom drawer, so the table always stays on screen. On desktop it stays below the table.
- **Hand History drawer**
  - A History button inside the table, available to the coach and students at any time.
  - Lists every finished hand of the lesson: hand number, your position, your cards, board, result and pot.
  - Tapping a hand shows its full action log, street by street. The visual replayer comes in the next step.
  - Students see only their own hole cards plus cards shown at showdown; the coach sees all.

## Technical details
- **Animation approach**: CSS transforms and opacity only (keyframes plus `transform: translate()`), no layout animations. I'm skipping framer-motion to keep the download small; CSS gives the same 60fps result on mid-range Android.
  - Seat and pot positions are computed once per layout as x/y percentages.
  - Chip "fly" elements are absolutely positioned and animated with `translate` between those points.
- **State store**
  - New `useTableStore` built with zustand (already installed). It holds table state, cards, an optimistic overlay and preferences (mute, 4-colour).
  - `useTrainingTable` writes Realtime updates into the store.
  - Components subscribe with selectors per seat, and `TableSeat` is wrapped in `React.memo`, so a move re-renders only the seats that changed.
- **Optimistic actions**: `act` applies a local projection right away (bet amount, stack, folded, badge) and remembers the previous snapshot. The server state replaces it on response or Realtime update; on an error it rolls back.
- **Layout math**
  - A container-aware oval: aspect ratio 3:4.4 in portrait, 16:9 otherwise.
  - Seats are placed on an ellipse about 8% outside the felt, with a minimum angle spacing so they can't overlap.
  - Bet chips sit at 55% of the way from the centre to each seat.
- **Cards**
  - Inline SVG suits plus CSS card faces, so there's nothing to download.
  - An off-screen render of the suit symbols on page open warms them up (no image downloads needed).
  - 4-colour mode is a CSS class.
- **Sounds**: short WebAudio tones built in code (deal tick, check knock, chip clink, turn chime), so there are no audio files to load. The mute setting is stored in localStorage.
- **Coach controls**: rendered inside a shadcn `Drawer` (bottom sheet) below the `md` breakpoint.
- **Hand History**
  - New `HandHistoryDrawer.tsx` (shadcn `Sheet`, side drawer).
  - Reads `training_hands` (ended hands of the lesson), `training_hand_actions` and `training_hand_private_cards`. Existing access rules already limit these to participants, and hole cards to their owner or the coach.
  - Positions are rebuilt from the dealer seat; shown cards come from the "show" actions.
  - Loaded on open and refreshed when a hand ends.
- All new wording in EN and HE. No database changes.

## Files
- **New**: `src/stores/useTableStore.ts`, `table/useTableLayout.ts`, `table/ChipStack.tsx`, `table/ActionBadge.tsx`, `table/HandHistoryDrawer.tsx`, `table/sounds.ts`
- **Rewritten**: `TableSeat.tsx`, `PlayingCard.tsx`, the table area of `TrainingTable.tsx`
- **Updated**: `useTrainingTable.ts`, `ActionBar.tsx`, `CoachControls.tsx`, `i18n.ts`

## Verification
- Build and type check.
- Playwright screenshots of the table layout at 393px portrait and 1280px desktop.
- The signed-in table can't be opened from here because your Supabase project is external. Instead I'll render the table component with a sample game state on a temporary test page, check that no seats overlap the felt, then remove the page.
