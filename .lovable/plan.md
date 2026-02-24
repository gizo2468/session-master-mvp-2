

## Plan: Fix Hand History Export — No Fabricated Data

### Problem

The current `generateHandHistory` function in `src/utils/pt4HandHistoryExport.ts` fabricates data that does not exist in the database:

1. **Fake players**: When no villains are recorded, it invents 5 placeholder opponents (Player2–Player6) with fake $400 stacks
2. **Fake stacks**: Villains without stack data get default `100*bb`; hero without stack gets `100*bb`
3. **Fake seat/button layout**: Assigns arbitrary seat numbers and button position
4. **Fake blind posting lines**: Generates `Player2: posts small blind` even though no such player exists
5. **Fake summary lines**: Shows `Player2 (small blind) folded`, `Player3 (under the gun) folded` etc. — all invented
6. **Empty action arrays**: Outputs `[]` when no actions exist (visible in screenshots)
7. **Fake pot/rake**: Computes pot from unrelated fields when pot_size isn't stored

### Solution

Rewrite `generateHandHistory` to be a **truthful raw export** that only includes data actually stored in the database. Sections with no data are omitted entirely.

### File to Modify

**`src/utils/pt4HandHistoryExport.ts`** — rewrite the `generateHandHistory` function (lines 327–520)

### New Export Structure Per Hand

```text
PokerStars Hand #<hash>: Hold'em No Limit ($2.00/$4.00) - 2026/01/30 19:18:35 ET
Table '<location_or_table_name>' Seat #<hero_seat> is the button
Seat <hero_seat>: Hero (<stack_if_known> in chips)
[Seat <villain_seat>: <villain_name> (<stack_if_known> in chips)]  ← only if villains recorded
*** HOLE CARDS ***
Dealt to Hero [5h 4d]                                              ← only if hole_cards stored
[*** FLOP *** [5c 5s 3d]]                                         ← only if flop_cards stored
[*** TURN *** [5c 5s 3d] [5d]]                                    ← only if turn_card stored
[*** RIVER *** [5c 5s 3d 5d] [Kh]]                                ← only if river_card stored
```

### Key Rules

1. **No placeholder opponents** — if `villains` is null/empty, no opponent seat lines appear
2. **No blind posting lines** — we don't store who posted blinds; omit entirely
3. **No fake stacks** — if `hero_stack_bb` is null, omit stack or write `UNKNOWN`; same for villains
4. **No action lines for empty actions** — if `preflop_actions` is null/empty AND `preflop_action` is null/empty, output nothing (no `[]`)
5. **No seat summary block** — we don't store per-player outcomes for opponents; omit the `Seat X: PlayerN folded` fabrication
6. **Table line** — omit `6-max` (we don't store max players); omit button position guess
7. **Showdown section** — only include if `showdown_result` is stored; only show hero/villain cards if actually recorded
8. **Summary section** — only include `Total pot` if `pot_size` is stored; only include `Board` if board cards exist; no `Rake $0.00` fabrication (use `Rake UNKNOWN`)
9. **Result** — if `result_value` and `result_unit` are stored, include a comment line like `** Hero result: +65 BB **`
10. **Game metadata** — include `game_type`, `position`, blinds ONLY if stored

### Specific Changes

- Remove the "add placeholder opponents" block (lines 385–395)
- Remove blind posting lines (lines 417–423)
- Remove seat summary loop (lines 503–517)
- Conditionally emit each section only when real data exists
- Remove `positionToSeat` / `seatToPositionLabel` helper usage for fabrication
- Keep `formatActions` but only call it when actions array is non-empty
- Change `Table` line to omit max-players and button if not stored

### What Stays The Same

- `fetchSessionsWithHandCounts` — unchanged
- `exportHandHistoryZip` — unchanged (file grouping, ZIP packaging)
- `getExportFileName` — unchanged
- `HandHistoryExportModal.tsx` — unchanged
- `StatsQuickView.tsx` — unchanged
- All helper functions for card parsing — unchanged

### Before/After Example

**Before** (fabricated):
```
Table 'home' 6-max Seat #2 is the button
Seat 2: Player2 ($400.00 in chips)
Seat 3: Hero ($100.00 in chips)
Seat 4: Player3 ($400.00 in chips)
...
Player2: posts small blind $2.00
Hero: posts big blind $4.00
*** HOLE CARDS ***
Dealt to Hero [5h 4d]
[]
*** FLOP *** [5c 5s 3d]
[]
...
Seat 2: Player2 (small blind) folded
Seat 4: Player3 (under the gun) folded
...
```

**After** (truthful):
```
PokerStars Hand #1847931181: Hold'em No Limit ($2.00/$4.00) - 2026/01/30 19:18:35 ET
Table 'home'
Seat 3: Hero ($100.00 in chips)
Seat 1: Villain ($120.00 in chips)
*** HOLE CARDS ***
Dealt to Hero [5h 4d]
*** FLOP *** [5c 5s 3d]
*** TURN *** [5c 5s 3d] [5d]
*** RIVER *** [5c 5s 3d 5d] [Kh]
*** SHOW DOWN ***
Hero: shows [5h 4d]
Villain: shows [4s 4h]
** Hero result: +65 BB **
*** SUMMARY ***
Board [5c 5s 3d 5d Kh]
```

