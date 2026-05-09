# Session Details Card — Full Metadata Mapping

Update `src/components/poker/SessionDetailsCard.tsx` so the card serves as the global container for the entire session's metadata. Active Tables section remains untouched.

## Field mapping (from `PokerSession`)

- **Session Name** → `session.location` — main card title (replaces current "Session Details" label as the primary heading? No — keep "Session Details" gold header, then show the Session Name as the bold black title beneath it, as it already does on line 86–88).
- **Currency** → `session.currency` + `getCurrencySymbol(session.currency)` — new label/value row, e.g. `Currency: USD ($)`.
- **Format (dynamic)** → derived from `session.tables`:
  - Collect unique `format` values from `tables` (`Cash`, `Tournament`).
  - If tables is empty, fall back to `session.format`.
  - Display joined by `, ` (e.g. `Cash`, `Tournament`, or `Cash, Tournament`).
- **Game Type** → `session.gameType` (already shown — keep).
- **Online / Physical Location** → if `session.isOnline` and `session.physicalLocation` is non-empty, show `Location: <physicalLocation>` row.
- **Festival Name** → if `session.festivalName` non-empty, show `Festival: <festivalName>` row.
- **First Table Name (`session.tableName`)** → explicitly NOT rendered in this card.

## Layout (top → bottom inside CardContent)

1. Label/value rows, all centered as `flex justify-between` pairs (matching existing Game Type row styling):
   - Format
   - Game Type (existing)
   - Currency
   - Location (only if online + value present)
   - Festival (only if value present)
2. Centered "Share with Coach" button (already in place between Game Type and Total Buy-Ins — keep position so it sits between the metadata rows and the Total Buy-Ins badge).
3. Existing Total Buy-Ins / Payouts / Profit / multi-day / notes blocks — unchanged.

## Header styling

Already correct from previous step: `text-lg font-bold text-poker-gold` centered, with Session Name (`session.location`) shown below in bold foreground. No change needed unless we discover mismatch with Active Tables — confirmed both use `text-lg font-bold text-poker-gold`.

## Out of scope

- `LiveSessionTables.tsx` (Active Tables section) — no edits.
- Buy-in calculations, sharing logic, multi-day rendering, notes — unchanged.
- Form / data model — unchanged; we only consume existing fields on `PokerSession`.

## Technical notes

- Use existing imports; no new dependencies.
- Currency display format: `${session.currency} (${currencySymbol})` when `session.currency` is set; otherwise hide row.
- Format derivation:
  ```ts
  const formats = Array.from(new Set((session.tables ?? []).map(t => t.format))).filter(Boolean);
  const formatDisplay = formats.length ? formats.join(', ') : session.format;
  ```
- Each new row mirrors the existing Game Type row markup for visual consistency.
