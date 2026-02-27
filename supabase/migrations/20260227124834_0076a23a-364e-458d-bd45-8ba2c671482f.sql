ALTER TABLE public.table_bb_stack_updates DROP CONSTRAINT IF EXISTS exclusive_game_type;
ALTER TABLE public.table_bb_stack_updates ADD CONSTRAINT exclusive_game_type CHECK (
  (level IS NOT NULL AND stack IS NOT NULL AND bb IS NOT NULL AND small_blind IS NULL AND big_blind IS NULL) OR
  (small_blind IS NOT NULL AND big_blind IS NOT NULL AND level IS NULL AND bb IS NULL)
);