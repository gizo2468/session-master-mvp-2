-- Clean up orphaned coach_student_connections with non-existent users
-- First, let's identify and remove connections where coach_id doesn't exist in profiles
DELETE FROM coach_student_connections 
WHERE coach_id NOT IN (SELECT id FROM profiles);

-- Also remove connections where student_id doesn't exist in profiles
DELETE FROM coach_student_connections 
WHERE student_id NOT IN (SELECT id FROM profiles);

-- Add a foreign key constraint to prevent this in the future (if it doesn't exist)
-- This will ensure data integrity going forward
DO $$ 
BEGIN
  -- Check if foreign key constraint exists for coach_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coach_student_connections_coach_id_fkey'
    AND table_name = 'coach_student_connections'
  ) THEN
    ALTER TABLE coach_student_connections 
    ADD CONSTRAINT coach_student_connections_coach_id_fkey 
    FOREIGN KEY (coach_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Check if foreign key constraint exists for student_id  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coach_student_connections_student_id_fkey'
    AND table_name = 'coach_student_connections'
  ) THEN
    ALTER TABLE coach_student_connections 
    ADD CONSTRAINT coach_student_connections_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END
$$;