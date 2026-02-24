

## Plan: Implement "SessionMaster Hand History Export (Strict v1)"

### Overview

Replace the current PokerStars-branded export with a custom "SessionMaster HH v1" plain-text format. No fake branding, no fabricated data, no JSON in output. Actions rendered as plain-text lines. Single TXT file inside ZIP.

### File to Modify

**`src/utils/pt4HandHistoryExport.ts`** — rewrite `generateHandHistory` and adjust `exportHandHistoryZip` + `getExportFileName`

### Changes

**1. `exportHandHistoryZip`** (lines 250-319)
- Instead of one TXT per session, produce a single TXT file: `SessionMaster_Hands_YYYYMMDD_to_YYYYMMDD.txt`
- All hands concatenated into one file separated by blank lines
- ZIP file name: `SessionMaster_Hands_YYYYMMDD_to_YYYYMMDD.zip`

**2. `getExportFileName`** (line 321-323)
- Change to `SessionMaster_Hands_YYYYMMDD_to_YYYYMMDD.zip`

**3. `generateHandHistory`** (lines 327-500) — full rewrite to SessionMaster format

New structure per hand:

```text
SessionMaster Hand
Session: <location> (<format>)
Table: <table_name>
Game: <NLH/PLO>
Blinds: <sb>/<bb>
Buy-in: <hero_stack_bb * bb> (or <hero_stack_bb> BB)
Date: <YYYY-MM-DD HH:mm>

Hero: [Qh Qs] (BTN) 55.3 BB
Villain: [7d Ad] (SB) 60 BB

PRE-FLOP
  Hero (BTN): Bet 4.3BB
FLOP [Qc 4d 3d]
  Hero (BTN): Bet 8.5BB
  Villain (SB): Call 8.5BB
TURN [Qc 4d 3d] [Qd]
  Hero (BTN): Bet 19BB
  Villain (SB): Call 19BB
RIVER [Qc 4d 3d Qd] [2d]
  Hero (BTN): All-in 40BB
  Villain (SB): Call 40BB

SHOWDOWN
  Hero: [Qh Qs]
  Villain: [7d Ad]

Result: +95 BB

---- END HAND ----
```

### Key Rules

- Header line is always `SessionMaster Hand` — no PokerStars branding, no invented hand IDs
- Metadata lines (Session/Table/Game/Blinds/Buy-in/Date) only appear if the value is stored in DB
- Hero line: cards (if stored), position (if stored), stack in BB (if stored) — omit missing parts
- Villain lines: only if villains array exists and is non-empty; each villain shows only stored fields
- Street blocks: only if actions are recorded for that street; actions formatted as plain text `Actor (Position): Action SizeBB` — NO JSON
- If no actions recorded for any street, print `NOTE: No actions were recorded for this hand.` and omit all street blocks
- SHOWDOWN: only if `showdown_result` is stored AND at least one player has cards
- Result: only if `result_value` is stored
- Board cards shown in street headers only if stored
- Every hand ends with `---- END HAND ----`
- No pot/rake lines (we don't reliably store these)
- No seat numbers, no button position, no `*** SUMMARY ***` block

**4. `formatActionsPlainText`** — new helper replacing `formatActions`
- Input: structured actions JSON array
- Output: plain text lines like `Hero (BTN): Bet 4.3BB` — using BB units directly from stored data, no dollar conversion
- If action has `unit: "BB"`, write `{size}BB`; if `unit: "Chips"`, write `{size} chips`
- Actor resolution: use actor field + position if available, e.g. `Hero (BTN)`, `Villain (SB)`

**5. Remove unused helpers**
- Remove `uuidToNumericId` (no longer generating fake hand IDs)
- Remove `fmt$` (no dollar formatting needed)
- Remove `seatToPositionLabel` (no seat summary)
- Keep `positionToSeat` only if needed — actually remove it too since no seat assignment
- Keep `parseCards`, `parseFlopCards`, `formatCard`, `formatGameType`

### Modal Changes

**`src/components/poker/HandHistoryExportModal.tsx`** (lines 77-81)
- Update dialog title from "Export Hands (PT4)" to "Export Hands (SessionMaster HH)"
- No other modal changes needed

### What Stays The Same
- `fetchSessionsWithHandCounts` — unchanged
- `HandHistoryExportModal.tsx` — UI layout unchanged (date pickers, session list, export button)
- `StatsQuickView.tsx` — unchanged
- ZIP packaging via JSZip — unchanged (just different file structure inside)

### Sample Output (3 hands)

**Hand 1 — Full data:**
```text
SessionMaster Hand
Session: home (Cash Game)
Game: NLH
Blinds: 2/4
Buy-in: 55.3 BB
Date: 2026-01-30 19:33

Hero: [Qh Qs] (BTN) 55.3 BB
Villain: [7d Ad] (SB) 60 BB

PRE-FLOP
  Hero (BTN): Bet 4.3BB
FLOP [Qc 4d 3d]
  Hero (BTN): Bet 8.5BB
  Villain (SB): Call 8.5BB
TURN [Qc 4d 3d] [Qd]
  Hero (BTN): Bet 19BB
  Villain (SB): Call 19BB
RIVER [Qc 4d 3d Qd] [2d]
  Hero (BTN): All-in 40BB
  Villain (SB): Call 40BB

SHOWDOWN
  Hero: [Qh Qs]
  Villain: [7d Ad]

Result: +95 BB

---- END HAND ----
```

**Hand 2 — No actions recorded:**
```text
SessionMaster Hand
Session: home (Cash Game)
Game: NLH
Blinds: 2/4
Buy-in: 65 BB
Date: 2026-01-30 18:50

Hero: [5h 4d] (BB) 65 BB

NOTE: No actions were recorded for this hand.

SHOWDOWN
  Hero: [5h 4d]

Result: +65 BB

---- END HAND ----
```

**Hand 3 — Minimal data (cards + result only):**
```text
SessionMaster Hand
Session: home (Cash Game)
Game: NLH
Date: 2026-01-30 20:10

Hero: [Ah Kd]

NOTE: No actions were recorded for this hand.

Result: -12 BB

---- END HAND ----
```

