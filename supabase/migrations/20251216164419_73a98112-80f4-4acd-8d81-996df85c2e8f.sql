-- Create function to notify coaches when player uploads a hand to a shared session
CREATE OR REPLACE FUNCTION public.notify_coaches_on_hand_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  player_username TEXT;
  coach_record RECORD;
BEGIN
  -- Get player username for personalized notification
  SELECT username INTO player_username
  FROM profiles 
  WHERE id = NEW.user_id;
  
  IF player_username IS NULL THEN
    player_username := 'A player';
  END IF;
  
  -- Find all coaches this session is shared with
  FOR coach_record IN 
    SELECT coach_id 
    FROM shared_sessions 
    WHERE session_id = NEW.session_id 
      AND player_id = NEW.user_id
  LOOP
    -- Create notification for each coach
    INSERT INTO notifications (
      recipient_user_id,
      sender_user_id,
      type,
      title,
      body,
      hand_id,
      session_id
    ) VALUES (
      coach_record.coach_id,
      NEW.user_id,
      'hand_uploaded',
      player_username || ' uploaded a new hand',
      'A new hand is available for review',
      NEW.id,
      NEW.session_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on session_hands_new INSERT
CREATE TRIGGER on_hand_uploaded
  AFTER INSERT ON session_hands_new
  FOR EACH ROW
  EXECUTE FUNCTION notify_coaches_on_hand_upload();