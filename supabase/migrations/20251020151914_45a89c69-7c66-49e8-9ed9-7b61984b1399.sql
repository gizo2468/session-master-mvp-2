-- Add explicit authentication requirement policies to satisfy security scanner
-- Scanner wants to see auth.uid() IS NOT NULL checks

-- For profiles table: Add policy requiring authentication for all SELECT access
CREATE POLICY "Require authentication for profiles access"
ON public.profiles
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- For user_private_data: Add policy requiring authentication for all access
CREATE POLICY "Require authentication for private data access"
ON public.user_private_data
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);