-- Update function to include session_id when creating notification
CREATE OR REPLACE FUNCTION public.create_feedback_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coach_username TEXT;
  hand_session_id UUID;
BEGIN
  -- Get coach username for personalized notification
  SELECT username INTO coach_username
  FROM profiles 
  WHERE id = NEW.coach_id;
  
  IF coach_username IS NULL THEN
    coach_username := 'Your coach';
  END IF;
  
  -- Get session_id from the hand
  SELECT session_id INTO hand_session_id
  FROM session_hands_new WHERE id = NEW.hand_id;
  
  -- Create notification for the player (student)
  INSERT INTO notifications (
    recipient_user_id,
    sender_user_id,
    type,
    title,
    body,
    hand_id,
    session_id
  ) VALUES (
    NEW.student_id,
    NEW.coach_id,
    'coach_feedback',
    'Feedback from ' || coach_username,
    'Your coach has reviewed one of your hands',
    NEW.hand_id,
    hand_session_id
  );
  
  RETURN NEW;
END;
$$;

-- Backfill existing notifications with session_id
UPDATE notifications n
SET session_id = shn.session_id
FROM session_hands_new shn
WHERE n.hand_id = shn.id
AND n.session_id IS NULL;