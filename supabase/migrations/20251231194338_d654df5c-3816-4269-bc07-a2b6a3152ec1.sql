-- Add player_goal_id column to notifications table for key_focus_point_created notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS player_goal_id uuid;

-- Create trigger function for key_focus_point_created notifications
CREATE OR REPLACE FUNCTION public.notify_student_on_goal_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  coach_username TEXT;
BEGIN
  -- Get coach username for personalized notification
  SELECT username INTO coach_username
  FROM profiles WHERE id = NEW.coach_id;
  
  IF coach_username IS NULL THEN
    coach_username := 'Your coach';
  END IF;
  
  -- Create notification for the student
  INSERT INTO notifications (
    recipient_user_id,
    sender_user_id,
    type,
    title,
    body,
    player_goal_id
  ) VALUES (
    NEW.student_id,
    NEW.coach_id,
    'key_focus_point_created',
    coach_username || ' assigned you a new focus point',
    COALESCE(NEW.title, 'A new key focus point has been added'),
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on player_goals table
DROP TRIGGER IF EXISTS on_player_goal_created ON public.player_goals;
CREATE TRIGGER on_player_goal_created
AFTER INSERT ON public.player_goals
FOR EACH ROW
EXECUTE FUNCTION notify_student_on_goal_created();