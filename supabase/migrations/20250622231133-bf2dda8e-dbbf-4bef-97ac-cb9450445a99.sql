
-- First, clean up orphaned session_tables records that don't have matching sessions
DELETE FROM public.session_tables 
WHERE session_id NOT IN (SELECT id FROM public.sessions);

-- Now add the missing foreign key constraint between session_tables and sessions
ALTER TABLE public.session_tables 
ADD CONSTRAINT session_tables_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

-- Ensure the constraint is properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_session_tables_session_id ON public.session_tables(session_id);
