
-- Chart Collections: groups solutions by stack depth / game type
CREATE TABLE public.chart_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  stack_depth_bb integer NOT NULL DEFAULT 100,
  game_type text NOT NULL DEFAULT 'NLH',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chart_collections ENABLE ROW LEVEL SECURITY;

-- Everyone can read defaults; users manage their own
CREATE POLICY "Anyone can read default collections" ON public.chart_collections
  FOR SELECT TO authenticated USING (is_default = true);

CREATE POLICY "Users can manage own collections" ON public.chart_collections
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Chart Solutions: individual spots within a collection
CREATE TABLE public.chart_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.chart_collections(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  hero_position text NOT NULL,
  villain_position text,
  action_type text NOT NULL DEFAULT 'RFI',
  spot_label text NOT NULL,
  range_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chart_solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read default solutions" ON public.chart_solutions
  FOR SELECT TO authenticated USING (is_default = true);

CREATE POLICY "Users can manage own solutions" ON public.chart_solutions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Custom Charts: overrides on default solutions
CREATE TABLE public.user_custom_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_solution_id uuid NOT NULL REFERENCES public.chart_solutions(id) ON DELETE CASCADE,
  custom_range_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  custom_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_custom_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own custom charts" ON public.user_custom_charts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed default 100bb NLH collection
INSERT INTO public.chart_collections (id, name, stack_depth_bb, game_type, is_default, user_id)
VALUES ('00000000-0000-0000-0000-000000000001', '100bb Cash NLH', 100, 'NLH', true, NULL);

-- Seed default solutions for all standard preflop spots
-- RFI spots (hero opens)
INSERT INTO public.chart_solutions (collection_id, hero_position, villain_position, action_type, spot_label, is_default, user_id, range_data) VALUES
('00000000-0000-0000-0000-000000000001', 'UTG', NULL, 'RFI', 'UTG RFI', true, NULL,
 '{"frequency": 12.5, "description": "Tight open from UTG ~12.5%"}'),
('00000000-0000-0000-0000-000000000001', 'MP', NULL, 'RFI', 'MP RFI', true, NULL,
 '{"frequency": 16.0, "description": "MP open ~16%"}'),
('00000000-0000-0000-0000-000000000001', 'LJ', NULL, 'RFI', 'LJ RFI', true, NULL,
 '{"frequency": 20.0, "description": "LJ open ~20%"}'),
('00000000-0000-0000-0000-000000000001', 'HJ', NULL, 'RFI', 'HJ RFI', true, NULL,
 '{"frequency": 24.0, "description": "HJ open ~24%"}'),
('00000000-0000-0000-0000-000000000001', 'CO', NULL, 'RFI', 'CO RFI', true, NULL,
 '{"frequency": 30.0, "description": "CO open ~30%"}'),
('00000000-0000-0000-0000-000000000001', 'BU', NULL, 'RFI', 'BU RFI', true, NULL,
 '{"frequency": 42.0, "description": "BU open ~42%"}'),
('00000000-0000-0000-0000-000000000001', 'SB', NULL, 'RFI', 'SB RFI', true, NULL,
 '{"frequency": 36.0, "description": "SB open ~36%"}'),

-- Facing RFI spots (hero defends)
-- BB vs various RFIs
('00000000-0000-0000-0000-000000000001', 'BB', 'UTG', 'DEFEND', 'BB vs UTG RFI', true, NULL,
 '{"frequency": 18.0, "description": "BB defend vs UTG ~18%"}'),
('00000000-0000-0000-0000-000000000001', 'BB', 'MP', 'DEFEND', 'BB vs MP RFI', true, NULL,
 '{"frequency": 22.0, "description": "BB defend vs MP ~22%"}'),
('00000000-0000-0000-0000-000000000001', 'BB', 'LJ', 'DEFEND', 'BB vs LJ RFI', true, NULL,
 '{"frequency": 26.0, "description": "BB defend vs LJ ~26%"}'),
('00000000-0000-0000-0000-000000000001', 'BB', 'HJ', 'DEFEND', 'BB vs HJ RFI', true, NULL,
 '{"frequency": 30.0, "description": "BB defend vs HJ ~30%"}'),
('00000000-0000-0000-0000-000000000001', 'BB', 'CO', 'DEFEND', 'BB vs CO RFI', true, NULL,
 '{"frequency": 35.0, "description": "BB defend vs CO ~35%"}'),
('00000000-0000-0000-0000-000000000001', 'BB', 'BU', 'DEFEND', 'BB vs BU RFI', true, NULL,
 '{"frequency": 42.0, "description": "BB defend vs BU ~42%"}'),
('00000000-0000-0000-0000-000000000001', 'BB', 'SB', 'DEFEND', 'BB vs SB RFI', true, NULL,
 '{"frequency": 50.0, "description": "BB defend vs SB ~50%"}'),

-- SB vs various RFIs
('00000000-0000-0000-0000-000000000001', 'SB', 'UTG', 'DEFEND', 'SB vs UTG RFI', true, NULL,
 '{"frequency": 10.0, "description": "SB defend vs UTG ~10%"}'),
('00000000-0000-0000-0000-000000000001', 'SB', 'MP', 'DEFEND', 'SB vs MP RFI', true, NULL,
 '{"frequency": 12.0, "description": "SB defend vs MP ~12%"}'),
('00000000-0000-0000-0000-000000000001', 'SB', 'CO', 'DEFEND', 'SB vs CO RFI', true, NULL,
 '{"frequency": 16.0, "description": "SB defend vs CO ~16%"}'),
('00000000-0000-0000-0000-000000000001', 'SB', 'BU', 'DEFEND', 'SB vs BU RFI', true, NULL,
 '{"frequency": 22.0, "description": "SB defend vs BU ~22%"}'),

-- 3Bet spots
('00000000-0000-0000-0000-000000000001', 'BB', 'UTG', '3BET', 'BB 3Bet vs UTG', true, NULL,
 '{"frequency": 5.0, "description": "BB 3bet vs UTG ~5%"}'),
('00000000-0000-0000-0000-000000000001', 'BB', 'CO', '3BET', 'BB 3Bet vs CO', true, NULL,
 '{"frequency": 9.0, "description": "BB 3bet vs CO ~9%"}'),
('00000000-0000-0000-0000-000000000001', 'BB', 'BU', '3BET', 'BB 3Bet vs BU', true, NULL,
 '{"frequency": 12.0, "description": "BB 3bet vs BU ~12%"}'),
('00000000-0000-0000-0000-000000000001', 'SB', 'BU', '3BET', 'SB 3Bet vs BU', true, NULL,
 '{"frequency": 14.0, "description": "SB 3bet vs BU ~14%"}'),
('00000000-0000-0000-0000-000000000001', 'CO', 'UTG', '3BET', 'CO 3Bet vs UTG', true, NULL,
 '{"frequency": 6.0, "description": "CO 3bet vs UTG ~6%"}'),
('00000000-0000-0000-0000-000000000001', 'BU', 'CO', '3BET', 'BU 3Bet vs CO', true, NULL,
 '{"frequency": 10.0, "description": "BU 3bet vs CO ~10%"}'),
('00000000-0000-0000-0000-000000000001', 'BU', 'UTG', '3BET', 'BU 3Bet vs UTG', true, NULL,
 '{"frequency": 5.5, "description": "BU 3bet vs UTG ~5.5%"}'),
('00000000-0000-0000-0000-000000000001', 'SB', 'CO', '3BET', 'SB 3Bet vs CO', true, NULL,
 '{"frequency": 10.0, "description": "SB 3bet vs CO ~10%"}'),

-- IP vs various (CO, BU defending vs earlier opens)
('00000000-0000-0000-0000-000000000001', 'CO', 'UTG', 'DEFEND', 'CO vs UTG RFI', true, NULL,
 '{"frequency": 12.0, "description": "CO defend vs UTG ~12%"}'),
('00000000-0000-0000-0000-000000000001', 'CO', 'MP', 'DEFEND', 'CO vs MP RFI', true, NULL,
 '{"frequency": 15.0, "description": "CO defend vs MP ~15%"}'),
('00000000-0000-0000-0000-000000000001', 'BU', 'UTG', 'DEFEND', 'BU vs UTG RFI', true, NULL,
 '{"frequency": 16.0, "description": "BU defend vs UTG ~16%"}'),
('00000000-0000-0000-0000-000000000001', 'BU', 'CO', 'DEFEND', 'BU vs CO RFI', true, NULL,
 '{"frequency": 25.0, "description": "BU defend vs CO ~25%"}'),
('00000000-0000-0000-0000-000000000001', 'BU', 'MP', 'DEFEND', 'BU vs MP RFI', true, NULL,
 '{"frequency": 20.0, "description": "BU defend vs MP ~20%"}'),
('00000000-0000-0000-0000-000000000001', 'BU', 'HJ', 'DEFEND', 'BU vs HJ RFI', true, NULL,
 '{"frequency": 22.0, "description": "BU defend vs HJ ~22%"}'),
('00000000-0000-0000-0000-000000000001', 'BU', 'LJ', 'DEFEND', 'BU vs LJ RFI', true, NULL,
 '{"frequency": 20.0, "description": "BU defend vs LJ ~20%"}'),
('00000000-0000-0000-0000-000000000001', 'HJ', 'UTG', 'DEFEND', 'HJ vs UTG RFI', true, NULL,
 '{"frequency": 10.0, "description": "HJ defend vs UTG ~10%"}'),
('00000000-0000-0000-0000-000000000001', 'LJ', 'UTG', 'DEFEND', 'LJ vs UTG RFI', true, NULL,
 '{"frequency": 8.0, "description": "LJ defend vs UTG ~8%"}');
