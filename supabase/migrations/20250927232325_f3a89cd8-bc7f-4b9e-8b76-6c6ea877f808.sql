-- Create data sharing consent table to track granular permissions
CREATE TABLE public.student_data_sharing_consent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  data_field TEXT NOT NULL, -- 'full_name', 'email', 'phone_number', 'profile_picture', 'address', 'date_of_birth'
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, coach_id, data_field)
);

-- Enable RLS on consent table
ALTER TABLE public.student_data_sharing_consent ENABLE ROW LEVEL SECURITY;

-- Create policies for consent table
CREATE POLICY "Students can manage their own consent" 
ON public.student_data_sharing_consent 
FOR ALL 
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view consent given to them" 
ON public.student_data_sharing_consent 
FOR SELECT 
USING (auth.uid() = coach_id AND granted = TRUE);

-- Create function to safely get consented student data for coaches
CREATE OR REPLACE FUNCTION public.get_consented_student_data(p_student_id UUID)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  profile_picture TEXT,
  address JSONB,
  date_of_birth DATE
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify coach-student connection exists and is approved
  IF NOT EXISTS (
    SELECT 1 FROM coach_student_connections 
    WHERE coach_id = auth.uid() 
      AND student_id = p_student_id 
      AND status = 'approved'
  ) THEN
    RETURN; -- Return empty if no approved connection
  END IF;

  -- Return only consented data fields
  RETURN QUERY
  SELECT 
    upd.id,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_student_id 
        AND coach_id = auth.uid() 
        AND data_field = 'full_name' 
        AND granted = TRUE
    ) THEN upd.full_name ELSE NULL END,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_student_id 
        AND coach_id = auth.uid() 
        AND data_field = 'email' 
        AND granted = TRUE
    ) THEN upd.email ELSE NULL END,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_student_id 
        AND coach_id = auth.uid() 
        AND data_field = 'phone_number' 
        AND granted = TRUE
    ) THEN upd.phone_number ELSE NULL END,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_student_id 
        AND coach_id = auth.uid() 
        AND data_field = 'profile_picture' 
        AND granted = TRUE
    ) THEN upd.profile_picture ELSE NULL END,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_student_id 
        AND coach_id = auth.uid() 
        AND data_field = 'address' 
        AND granted = TRUE
    ) THEN upd.address ELSE NULL END,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_student_id 
        AND coach_id = auth.uid() 
        AND data_field = 'date_of_birth' 
        AND granted = TRUE
    ) THEN upd.date_of_birth ELSE NULL END
  FROM user_private_data upd
  WHERE upd.id = p_student_id;
END;
$$;

-- Create similar function for students to get consented coach data
CREATE OR REPLACE FUNCTION public.get_consented_coach_data(p_coach_id UUID)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  profile_picture TEXT,
  address JSONB,
  date_of_birth DATE
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify coach-student connection exists and is approved
  IF NOT EXISTS (
    SELECT 1 FROM coach_student_connections 
    WHERE student_id = auth.uid() 
      AND coach_id = p_coach_id 
      AND status = 'approved'
  ) THEN
    RETURN; -- Return empty if no approved connection
  END IF;

  -- Return only consented data fields (check consent from coach's perspective)
  RETURN QUERY
  SELECT 
    upd.id,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_coach_id 
        AND coach_id = auth.uid() 
        AND data_field = 'full_name' 
        AND granted = TRUE
    ) THEN upd.full_name ELSE NULL END,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_coach_id 
        AND coach_id = auth.uid() 
        AND data_field = 'email' 
        AND granted = TRUE
    ) THEN upd.email ELSE NULL END,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_coach_id 
        AND coach_id = auth.uid() 
        AND data_field = 'phone_number' 
        AND granted = TRUE
    ) THEN upd.phone_number ELSE NULL END,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_coach_id 
        AND coach_id = auth.uid() 
        AND data_field = 'profile_picture' 
        AND granted = TRUE
    ) THEN upd.profile_picture ELSE NULL END,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_coach_id 
        AND coach_id = auth.uid() 
        AND data_field = 'address' 
        AND granted = TRUE
    ) THEN upd.address ELSE NULL END,
    CASE WHEN EXISTS (
      SELECT 1 FROM student_data_sharing_consent 
      WHERE student_id = p_coach_id 
        AND coach_id = auth.uid() 
        AND data_field = 'date_of_birth' 
        AND granted = TRUE
    ) THEN upd.date_of_birth ELSE NULL END
  FROM user_private_data upd
  WHERE upd.id = p_coach_id;
END;
$$;

-- Drop the existing overly permissive RLS policies
DROP POLICY "Coaches can access connected student data" ON public.user_private_data;
DROP POLICY "Students can access connected coach data" ON public.user_private_data;

-- Create new restrictive RLS policies that block direct access
-- Only allow users to access their own data directly
CREATE POLICY "Users can only access their own private data directly" 
ON public.user_private_data 
FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Block all other direct access to the private data table
-- Coaches and students must use the consent-based functions instead
CREATE POLICY "Block direct access to others private data" 
ON public.user_private_data 
FOR SELECT 
USING (FALSE);

-- Update the existing database functions to use consent-based access
DROP FUNCTION IF EXISTS public.get_coach_accessible_student_data(UUID);
DROP FUNCTION IF EXISTS public.get_student_accessible_coach_data(UUID);

-- Replace with consent-aware versions
CREATE OR REPLACE FUNCTION public.get_coach_accessible_student_data(student_user_id UUID)
RETURNS TABLE(id UUID, full_name TEXT, profile_picture TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    result.id,
    result.full_name,
    result.profile_picture
  FROM public.get_consented_student_data(student_user_id) result;
$$;

CREATE OR REPLACE FUNCTION public.get_student_accessible_coach_data(coach_user_id UUID)
RETURNS TABLE(id UUID, full_name TEXT, profile_picture TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    result.id,
    result.full_name,
    result.profile_picture
  FROM public.get_consented_coach_data(coach_user_id) result;
$$;

-- Create trigger to automatically update timestamps on consent table
CREATE TRIGGER update_student_data_sharing_consent_updated_at
  BEFORE UPDATE ON public.student_data_sharing_consent
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE public.student_data_sharing_consent IS 'Tracks granular consent for sharing specific data fields between students and coaches';
COMMENT ON FUNCTION public.get_consented_student_data(UUID) IS 'Returns only consented student data fields for authenticated coaches';
COMMENT ON FUNCTION public.get_consented_coach_data(UUID) IS 'Returns only consented coach data fields for authenticated students';