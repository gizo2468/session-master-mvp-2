-- Add hero_stack_bb column to session_hands_new table
-- This separates hero's stack size (in BB) from table blind settings
ALTER TABLE session_hands_new 
ADD COLUMN IF NOT EXISTS hero_stack_bb NUMERIC DEFAULT NULL;