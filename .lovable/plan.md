

## Create New Solutions (No Editing of Existing Ranges)

### Scope
Users can **create** their own custom solutions and collections from scratch. They **cannot** edit or override existing default hand ranges — those remain read-only.

### Changes

**1. Mutation hooks** (`src/hooks/useChartsLibrary.ts`)
- `useCreateCollection` — inserts into `chart_collections` with `user_id`, `is_default: false`
- `useCreateSolution` — inserts into `chart_solutions` with user-defined range data, hero/villain positions, action type
- `useDeleteSolution` — deletes user-owned solutions only
- `useDeleteCollection` — deletes user-owned collections only
- All mutations invalidate relevant query keys

**2. Create Collection Dialog** (`src/components/charts/CreateCollectionDialog.tsx`)
- Simple dialog: name, stack depth (bb), game type (NLH/PLO)
- Triggered by a "+" button next to the collection selector in `ChartsLibrary.tsx`

**3. Create Solution Sheet** (`src/components/charts/CreateSolutionSheet.tsx`)
- Bottom sheet with fields: hero position, villain position (optional for RFI), action type (RFI/DEFEND/3BET), spot label (auto-generated)
- Includes a **HandRangeGrid in creation mode** — user taps cells to toggle Raise/Call/Fold
- Save button creates the solution in the user's collection
- Only available when viewing a user-owned collection (not default)

**4. HandRangeGrid update** (`src/components/charts/HandRangeGrid.tsx`)
- Add `editable` prop — when true, tapping a cell cycles Raise → Call → Fold
- Add `rangeState` + `onRangeChange` props for controlled editing during creation
- Existing read-only usage (SpotDetailView) stays unchanged — no editing of existing charts

**5. PositionMatrix update** (`src/components/charts/PositionMatrix.tsx`)
- Empty "+" cells in user-owned collections open the CreateSolutionSheet with pre-filled hero position and scenario
- "+" cells in default collections remain disabled (no creation into system collections)

**6. ChartsLibrary page update** (`src/pages/ChartsLibrary.tsx`)
- Add "+" button next to collection selector → opens CreateCollectionDialog
- Pass collection ownership info to PositionMatrix so it knows if creation is allowed
- Show delete option for user-owned collections

### What stays the same
- Default ranges are **read-only** — no edit, no override, no `user_custom_charts` usage
- SpotDetailView shows ranges without any edit controls
- Existing grid colors/layout unchanged

### Files
| File | Action |
|---|---|
| `src/hooks/useChartsLibrary.ts` | Add mutation hooks |
| `src/components/charts/CreateCollectionDialog.tsx` | New |
| `src/components/charts/CreateSolutionSheet.tsx` | New |
| `src/components/charts/HandRangeGrid.tsx` | Add `editable` mode for creation only |
| `src/components/charts/PositionMatrix.tsx` | Enable "+" cells for user collections |
| `src/pages/ChartsLibrary.tsx` | Add create collection button, pass ownership |

