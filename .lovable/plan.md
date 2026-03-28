

## Charts Library / GTO Solutions Workspace

### Overview
Build a professional GTO-style charts/solutions workspace accessible to all users (coaches and players). The feature provides a structured, position-based matrix view for browsing poker spots, viewing hand range charts, and eventually creating custom solutions.

### Architecture

#### Database (3 new tables)

**`chart_collections`** — Groups of solutions by stack depth
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | Owner (null = system default) |
| name | text | e.g. "100bb Cash" |
| stack_depth_bb | integer | e.g. 100 |
| game_type | text | "NLH", "PLO" |
| is_default | boolean | System-provided vs user-created |
| created_at | timestamptz | |

**`chart_solutions`** — Individual spots within a collection
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| collection_id | uuid FK | |
| user_id | uuid | Owner |
| hero_position | text | BB, SB, BU, CO, HJ, LJ, MP, UTG |
| villain_position | text | Same set |
| action_type | text | "RFI", "3Bet", "ISO", "LFI" |
| spot_label | text | Display label, e.g. "vs UTG RFI" |
| range_data | jsonb | 13x13 matrix of hand actions |
| notes | text | User notes on the spot |
| is_default | boolean | |
| created_at / updated_at | timestamptz | |

**`user_custom_charts`** — User overrides on default solutions
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| base_solution_id | uuid FK → chart_solutions | |
| custom_range_data | jsonb | Override range data |
| custom_notes | text | |
| created_at / updated_at | timestamptz | |

RLS: Users can manage their own rows. Default (system) charts are readable by all authenticated users.

#### Migration
One migration creates all 3 tables, RLS policies, and seeds default structure data (100bb collection with all position spots — BB vs UTG RFI, BB vs MP RFI, etc. for all 8 positions). Range data for defaults will contain a basic structure placeholder (not proprietary solver output).

### Frontend Components

**1. Route & Entry Point**
- New route `/charts-library` in `App.tsx`
- New lazy-loaded page `src/pages/ChartsLibrary.tsx`
- "Charts Library" button added at bottom of `MyCoachingNetwork` card (after connections area / empty state, before the closing `</CardContent>`)
- Also accessible from Dashboard for players (both roles can use it)

**2. ChartsLibrary Page** (`src/pages/ChartsLibrary.tsx`)
- Header with back button → parent route
- "Solutions" filter/selector to switch between collections (e.g. 100bb, 50bb)
- Position matrix grid as the main view

**3. PositionMatrix Component** (`src/components/charts/PositionMatrix.tsx`)
- 8-column grid: BB, SB, BU, CO, HJ, LJ, MP, UTG (matching the reference images)
- Rows represent scenarios: vs UTG RFI, vs MP RFI, vs LJ RFI, vs HJ RFI, vs CO RFI/3Bet, vs BU RFI/3Bet, vs SB RFI/3Bet, vs BB 3Bet/ISO/LFI
- Each cell is tappable, color-coded (green = available, gray = N/A, gold = RFI spot)
- Cells show labels like "vs UTG RFI", "CO RFI 35.6%"
- Designed to match the professional BBZ Poker style from the reference images

**4. SpotDetailView Component** (`src/components/charts/SpotDetailView.tsx`)
- Opens as a full page or modal when tapping a cell
- Shows 13x13 hand range grid (AA through 22, suited/offsuit)
- Each cell color-coded by action: Fold (blue), Call (green), Raise (red/orange)
- Legend at bottom showing action frequencies
- Header shows spot context: "BB vs UTG RFI" with stack depth

**5. HandRangeGrid Component** (`src/components/charts/HandRangeGrid.tsx`)
- Reusable 13x13 poker hand matrix
- Rows/columns: A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2
- Upper-right = suited, lower-left = offsuit, diagonal = pairs
- Each cell colored by action distribution from `range_data` jsonb

### Data Seeding
The migration seeds one default collection ("100bb Cash NLH") with ~40 spot entries covering all standard preflop scenarios. Range data uses a simplified default structure (e.g., marking tight UTG ranges, wider BU ranges) — no proprietary solver data. The structure gives users a meaningful starting point.

### Navigation Hierarchy
```text
Home (/) or Coach Dashboard (/coach-dashboard)
  └── Charts Library (/charts-library)      → Back = previous page
        └── Spot Detail (/charts-library/:spotId)  → Back = /charts-library
```

### Scope for This Implementation
1. Database tables + RLS + seed data migration
2. ChartsLibrary page with position matrix grid
3. Spot detail view with 13x13 hand range grid
4. Entry point button in MyCoachingNetwork
5. Route registration in App.tsx

### Deferred (backlog)
- Custom chart creation/editing UI
- Coach-player chart attachments (hand reviews, focus points)
- Multiple collection management
- Import/export solutions

### Files to Create/Modify
| File | Action |
|---|---|
| `supabase/migrations/[timestamp]_charts_library.sql` | Create tables, RLS, seed data |
| `src/pages/ChartsLibrary.tsx` | New page |
| `src/components/charts/PositionMatrix.tsx` | New — matrix grid |
| `src/components/charts/SpotDetailView.tsx` | New — spot detail with range grid |
| `src/components/charts/HandRangeGrid.tsx` | New — 13x13 hand matrix |
| `src/hooks/useChartsLibrary.ts` | New — data fetching hook |
| `src/App.tsx` | Add route |
| `src/components/coaching/MyCoachingNetwork.tsx` | Add Charts Library button |

