
-- Fix the end_time column to be nullable since sessions don't have an end time when created
ALTER TABLE public.sessions ALTER COLUMN end_time DROP NOT NULL;
