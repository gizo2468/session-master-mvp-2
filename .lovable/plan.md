

## Plan: Make "Total Hands" Clickable + PT4-Compatible Hand History Export

### Overview

Add a clickable "Total Hands" metric in Sessions Stats that opens an "Export Hands (PT4)" modal. The modal allows date range selection, shows matching sessions with hand counts, and exports a ZIP of PokerStars-style hand history TXT files that PokerTracker 4 can import.

### Data Available for Export

From the `session_hands_new` table, each hand has:
- `hole_cards`, `position`, `small_blind`, `big_blind`, `hero_stack_bb`
- `preflop_actions`, `flop_actions`, `turn_actions`, `river_actions` (JSON arrays with actor/action/size/unit)
- `flop_cards`, `turn_card`, `river_card`
- `pot_size`, `amount_won`, `amount_invested`
- `showdown_result`, `result_value`, `result_unit`
- `villains` (JSON with position/hand/bigBlind)
- `game_type` (NLH/PLO)
- `hand_number`, `created_at`
- Related session data: `session_id` -> sessions table (format, location, currency, blinds, start_time)
- Related table data: `table_id` -> session_tables (table_name, stakes, game_format)

This is sufficient to generate PokerStars-style hand histories. Missing data (e.g., unknown villain names, incomplete actions) will use safe placeholders.

### New Dependencies

- **`jszip`** -- for creating ZIP files in-browser (no server needed)

### Files to Create

**1. `src/utils/pt4HandHistoryExport.ts`** -- Core export logic
- Function to query `session_hands_new` with joined `sessions` and `session_tables` data for a date range
- Function to convert each hand record into PokerStars-format hand history text:

```text
PokerStars Hand #<hand_id_hash>: <game_type> ($<sb>/$<bb>) - <date> <time>
Table '<table_name>' <max_players>-max Seat #<btn_seat> is the button
Seat 1: Hero ($<stack>)
Seat 2: Villain1 ($<stack>)
...
Hero: posts small blind $<sb>
Villain1: posts big blind $<bb>
*** HOLE CARDS ***
Dealt to Hero [<cards>]
<preflop_actions>
*** FLOP *** [<flop_cards>]
<flop_actions>
*** TURN *** [<board>] [<turn>]
<turn_actions>
*** RIVER *** [<board>] [<river>]
<river_actions>
*** SHOW DOWN ***
<showdown if available>
*** SUMMARY ***
Total pot $<pot> | Rake $0
Board [<full_board>]
Seat 1: Hero <result>
```

- Handles missing data gracefully (placeholder villain names like "Player2", default stacks, omitted streets if no cards)
- Groups hands by session into separate TXT files
- Uses JSZip to package into `export_hands_YYYYMMDD-YYYYMMDD.zip`

**2. `src/components/poker/HandHistoryExportModal.tsx`** -- UI modal
- Date range picker (Start Date + End Date) using existing Calendar/Popover components
- Fetches sessions with hands in the selected range from `session_hands_new` joined with `sessions`
- Displays list of matching sessions: date, name/location, game type, hand count
- Empty state when no hands found
- "Export Hands" button that triggers the export
- Loading/progress state during export

### Files to Modify

**3. `src/components/StatsQuickView.tsx`**
- Lines 276-279 (non-extended "Total Hands" cell): wrap the value+label in a clickable button that opens the export modal
- Lines 309-312 (extended "Total Hands" cell): same treatment
- Import and render `HandHistoryExportModal` with open/close state
- No visual size/layout changes -- just add `cursor-pointer` and underline-on-hover to indicate clickability

### PokerStars Hand History Format Details

The export will follow the standard PokerStars format that PT4 recognizes:
- Hand ID: numeric hash derived from the UUID
- Game type: "Hold'em No Limit" or "Omaha Pot Limit"
- Currency amounts from blinds (converted from chips to dollar notation)
- Seat assignments derived from position data (BTN=seat 1, SB=seat 2, BB=seat 3, etc.)
- Actions formatted as: `PlayerName: <action> $<amount>`
- Board cards in bracket notation: `[Ah Kd 7s]`
- Card format: rank+suit letter (e.g., "Ah", "Td", "9c", "2s")
- When action data is structured JSON (`preflopActions` etc.), each entry maps to a line
- When action data is legacy text strings, output as-is in a comment or best-effort parse
- Missing hole cards: `[?? ??]`
- Missing villain info: auto-generated names and default stack sizes

### Export Flow

1. User taps "Total Hands" in Sessions Stats
2. Modal opens with date pickers defaulting to last 30 days
3. Query runs: fetch sessions with hand counts in date range
4. User sees session list with hand counts
5. User taps "Export Hands"
6. System fetches full hand data for all matching sessions
7. Generates PokerStars-format text per hand, grouped by session into TXT files
8. Packages into ZIP using JSZip
9. Triggers browser download of the ZIP file

### What stays the same
- All existing stats layout, sizes, colors, spacing
- All other metrics remain non-clickable
- No changes to My Finance / PDF export
- No changes to hand recording or session flows

