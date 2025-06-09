
-- Step 3: Apply RLS policies for session_results table
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own session results" ON public.session_results;
DROP POLICY IF EXISTS "Users can create their own session results" ON public.session_results;
DROP POLICY IF EXISTS "Users can update their own session results" ON public.session_results;
DROP POLICY IF EXISTS "Users can delete their own session results" ON public.session_results;

-- Create comprehensive RLS policies for session_results
CREATE POLICY "Users can view their own session results"
ON public.session_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE sessions.id = session_results.session_id 
    AND sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own session results"
ON public.session_results FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE sessions.id = session_results.session_id 
    AND sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own session results"
ON public.session_results FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE sessions.id = session_results.session_id 
    AND sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own session results"
ON public.session_results FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE sessions.id = session_results.session_id 
    AND sessions.user_id = auth.uid()
  )
);
