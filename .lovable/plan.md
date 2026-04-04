

## Rearrange Completed Tables Card Layout (Active Session Only)

### Current layout (lines 95–292)
1. **Header**: Duration (absolute left) + centered title/subtitle
2. **Tournament fields** (Starting BBs, Tournament Type, etc.)
3. **Summary row**: Buy-In left, Total Payout + Profit/Loss stacked on right (`px-6`)

### Target layout
1. **Header**: Centered title/subtitle only (no Duration here)
2. **Tournament fields** (unchanged)
3. **Duration** — centered, between tournament fields and the buy-in/payout row
4. **Buy-In + Total Payout** — side by side, closer together (centered group)
5. **Profit/Loss** — centered below the buy-in/payout row

### Changes — single file: `src/components/poker/CompletedTablesDisplay.tsx`

**A. Remove Duration from the header (lines 96–117)**
- Remove the absolute-positioned Duration block (lines 97–106)
- Keep only the centered title/subtitle div

**B. Insert Duration between tournament fields and summary (after line 212)**
- Add a centered Duration block with the same label and `TableTimerDisplay`, placed after the tournament-specific fields section and before the summary area

**C. Restructure the summary area (lines 242–292)**
- Replace the current `flex justify-between px-6` layout with:
  - A centered row using `flex justify-center gap-8` for Buy-In and Total Payout side by side (closer together)
  - A separate centered div below for Profit/Loss
- Move Profit/Loss out of the right-side div into its own `text-center mt-2` block beneath

