-- Add second layer of defense: validation trigger for user_private_data
-- This ensures users can only access their own records, independent of RLS

-- Create validation function (internal use only, not exposed via API)
CREATE OR REPLACE FUNCTION public.validate_user_private_data_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Ensure user can only create/modify their own record
  IF NEW.id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Users can only access their own private data'
      USING HINT = 'You can only create or modify records for your own user ID';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to user_private_data table
DROP TRIGGER IF EXISTS enforce_user_private_data_ownership ON public.user_private_data;

CREATE TRIGGER enforce_user_private_data_ownership
  BEFORE INSERT OR UPDATE ON public.user_private_data
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_private_data_ownership();

-- Add documentation
COMMENT ON FUNCTION public.validate_user_private_data_ownership() IS 
  'Internal validation function: Second layer of defense for user_private_data ownership verification';

COMMENT ON TRIGGER enforce_user_private_data_ownership ON public.user_private_data IS 
  'Second layer of defense: Validates user ownership at database level, independent of RLS policies';