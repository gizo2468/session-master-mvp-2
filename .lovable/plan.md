

## Refactor Charts Library into Workspace with Folders

### What changes
Transform the Charts Library from a demo-like screen (with a built-in default 100bb collection and 35 prefilled solutions) into a clean workspace where users create and organize their own content using folders.

### Database changes

**1. Add `chart_folders` table**
```sql
CREATE TABLE public.chart_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.chart_folders ENABLE ROW LEVEL SECURITY;
-- Users see only their own folders
CREATE POLICY "Users manage own folders" ON public.chart_folders
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

**2. Add `folder_id` column to `chart_collections`**
```sql
ALTER TABLE public.chart_collections
  ADD COLUMN folder_id uuid REFERENCES public.chart_folders(id) ON SET NULL;
```
Collections without a folder appear as "unfiled" at the root level.

**3. Remove default data**
```sql
DELETE FROM chart_solutions WHERE is_default = true;
DELETE FROM chart_collections WHERE is_default = true;
```

### Code changes

**4. `src/hooks/useChartsLibrary.ts`**
- Add `ChartFolder` interface and `useChartFolders()` query (fetch user's folders)
- Add `useCreateFolder()` and `useDeleteFolder()` mutations
- Update `useChartCollections()` to remove `is_default.eq.true` from the query — only fetch `user_id.eq.${user?.id}`
- Add optional `folder_id` to `ChartCollection` interface and `useCreateCollection` params
- Remove `is_default` references from queries (no longer relevant)

**5. `src/pages/ChartsLibrary.tsx`** — Major restructure
- Replace the flat collection selector with a folder-based workspace view
- **Default view**: List of folders + unfiled collections
  - Each folder shows as an expandable/clickable card with name and collection count
  - Unfiled collections shown separately at bottom
- **Empty state**: When no folders and no collections exist, show a clean message: "No charts yet — Create your first folder to get started" with a prominent "Create Folder" button
- **Inside a folder**: Show the folder's collections as cards; tapping one enters the position matrix view (existing flow)
- **Top bar**: Keep header + info icon; add "New Folder" button
- **Folder actions**: Long-press or menu to rename/delete a folder

**6. New component: `src/components/charts/CreateFolderDialog.tsx`**
- Simple dialog with folder name input
- Uses `useCreateFolder()` mutation

**7. Update `src/components/charts/CreateCollectionDialog.tsx`**
- Add optional `folderId` prop so collections can be created inside a specific folder
- Pass `folder_id` to the mutation

**8. `src/components/charts/PositionMatrix.tsx`** — No changes needed
The matrix still works the same once a collection is selected.

### Navigation flow

```text
Charts Library (workspace root)
  ├── 📁 Folder: "Cash Games"
  │     ├── Collection: "100bb NLH"  → Position Matrix → Spot Detail
  │     └── Collection: "50bb NLH"   → Position Matrix → Spot Detail
  ├── 📁 Folder: "Tournaments"
  │     └── Collection: "40bb Push/Fold" → ...
  └── [Unfiled collections if any]
```

### What stays the same
- Position matrix grid, spot detail view, hand range grid, paint mode
- Collection creation flow (just gains optional folder assignment)
- Solution creation/editing/deletion
- Info/help terminology dialog
- All header styling and back button colors

