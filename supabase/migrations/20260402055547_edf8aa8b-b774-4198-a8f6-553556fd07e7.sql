
CREATE TABLE public.chart_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.chart_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own folders" ON public.chart_folders
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.chart_collections
  ADD COLUMN folder_id uuid REFERENCES public.chart_folders(id) ON DELETE SET NULL;

DELETE FROM chart_solutions WHERE is_default = true;
DELETE FROM chart_collections WHERE is_default = true;
