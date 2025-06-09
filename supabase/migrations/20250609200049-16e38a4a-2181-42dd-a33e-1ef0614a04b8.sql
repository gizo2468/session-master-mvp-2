
-- Step 2A: Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Step 2B: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.sessions;

-- Step 2C: Recreate proper RLS policies
CREATE POLICY "Users can read their own sessions"
ON public.sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON public.sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.sessions FOR DELETE
USING (auth.uid() = user_id);
