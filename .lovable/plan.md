# Live Training Lab table – full mobile redesign

Goal: a fixed, full-screen portrait poker table matching the reference layout (stadium felt, seats on the rail, hero bottom-left, raise presets right column, Fold/Call bottom), with our own branding. Game rules and server stay unchanged.

## What the user will see
1. **Full screen, no scroll** – entering a table hides the app header/nav; the screen is exactly the phone's height and width with notch/home-bar safe areas. Everything scales with the screen (375×667 up to 430×932+). Desktop shows the same portrait table centered at phone width.
2. **Background & table** – near-black backdrop with soft vignette; tall stadium table with thick dark rail, green felt (#35654D range) with center glow and faint inner line. Faint app logo + game type ("NLH"/"PLO") in the middle; blinds, hand # and lesson title as subtle text below.
3. **Seats on the rail** – hand-tuned positions for 2 to 9 players (no overlaps with seats, pot or board). Round avatar (photo or initials), dark name plate with name and stack in BB, small card backs for opponents in the hand, gold "D" chip, bet chip stack with "2.5BB" toward center, glowing ring + countdown bar for the active player, folded seats at 40%, short action badge pop.
4. **My seat** – bottom-left, larger avatar, my 2 (or 4 for PLO) cards large and face up overlapping above it, highlighted plate.
5. **Center** – board cards in a row above a "Total Pot" pill. Amounts in BB by default, switchable to chips.
6. **Action buttons (my turn only)** – bottom row big Fold and Call X BB / Check; right column 4 raise presets (postflop 33/50/75/100% pot "Raise to X BB"; preflop 2.2x/2.5x/3x/All-in); "^" opens a raise slider sheet, keypad button opens custom amount entry. 48px+ targets, slide in/out. Otherwise a small "Waiting for <name>…" line.
7. **Top bar** – thin transparent: exit on the left; Hand History and a menu (sound, 4-color deck, BB/chips) on the right.
8. **Coach** – same table; floating gold round "Coach" button opens a bottom sheet with all current controls (start/pause/resume/end, deal / auto-deal, timer, God view, pause & discuss, quick note, next-hand presets, seat management, take a seat / stop playing). God view shows all cards face up on seats. Tapping a seat between hands opens its menu as a bottom sheet.
9. Hand history, last actions, settings and coach panel all open as overlays/sheets on top of the table, never below it.

## Technical details
- `TrainingTable.tsx`: root `fixed inset-0 h-[100dvh] w-screen overflow-hidden overscroll-none`, safe-area padding, inner column `max-w-[min(100vw,480px)] mx-auto`; route rendered without app chrome (check App/layout for header/bottom nav and exclude this route).
- Portrait lock: `screen.orientation.lock('portrait')` attempt (Capacitor/PWA) plus a "rotate your phone" overlay in landscape on small screens.
- New `seatLayouts.ts`: per-player-count tables of seat positions as % of the table box (hero index always bottom-left), plus bet-chip anchor per seat. Replace ellipse math in `useTableLayout.ts`.
- Sizing via CSS vars derived from container (`--u: min(1dvh, 2.1vw)` style clamp()) so avatars, cards, fonts scale; no fixed px.
- Rewrite `TableFelt.tsx` (stadium shape, logo watermark, info text, pot pill, board), `TableSeat.tsx` (avatar + plate + countdown bar, hero variant, god-view cards), `ActionBar.tsx` (new grid: presets column + Fold/Call row + slider/keypad sheets). Preset sizes computed client-side from state, sent as normal raise commands — server still validates.
- New `TableTopBar.tsx`, `TableMenuSheet.tsx`, `CoachFab.tsx`; `CoachControls` and `SeatMenu` moved into bottom sheets (vaul Drawer).
- Store: add `amountUnit: 'bb' | 'chips'` pref (persisted) to `useTableStore`; shared `formatAmount` helper.
- Keep existing animation keyframes, transform/opacity only, memoized seats, optimistic flow; add EN/HE strings in `trainingLab/i18n.ts`.
- Verify with Playwright on a temporary sample-state render at 375×667, 390×844, 430×932 and desktop: no scroll (scrollHeight == innerHeight), no seat/board/pot bounding-box overlaps for 2–9 seats; remove the sample afterwards. Signed-in real lesson still needs user testing.
