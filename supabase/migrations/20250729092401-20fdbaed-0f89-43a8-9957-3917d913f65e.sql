-- Fix security issue: Add search_path to the function
CREATE OR REPLACE FUNCTION public.increment_coach_student_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment when a connection changes from pending/rejected to approved
  -- and it's a new unique student for this coach
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles 
    SET students_coached_count = students_coached_count + 1
    WHERE id = NEW.coach_id 
      AND role = 'coach'
      -- Only increment if this student wasn't already counted for this coach
      AND NOT EXISTS (
        SELECT 1 FROM public.coach_student_connections
        WHERE coach_id = NEW.coach_id 
          AND student_id = NEW.student_id 
          AND status = 'approved'
          AND id != NEW.id
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';