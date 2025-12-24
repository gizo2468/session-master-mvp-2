-- Add initiated_by column to track who created the connection request
ALTER TABLE public.coach_student_connections 
ADD COLUMN initiated_by uuid;

-- Backfill existing pending records (assume student initiated for historical data)
UPDATE public.coach_student_connections 
SET initiated_by = student_id 
WHERE initiated_by IS NULL;

-- Make it required for new records going forward
ALTER TABLE public.coach_student_connections 
ALTER COLUMN initiated_by SET NOT NULL;