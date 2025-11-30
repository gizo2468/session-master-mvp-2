-- Add constraint to prevent self-connections (coach_id cannot equal student_id)
ALTER TABLE public.coach_student_connections 
ADD CONSTRAINT no_self_connection 
CHECK (coach_id != student_id);