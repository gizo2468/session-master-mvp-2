CREATE OR REPLACE FUNCTION public.create_feedback_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  coach_username TEXT;
  hand_session_id UUID;
  notification_inserted BOOLEAN := false;
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
  )
  ON CONFLICT ON CONSTRAINT notifications_unique_hand_event DO NOTHING
  RETURNING true INTO notification_inserted;
  
  -- Only send push notification if a new notification was created
  IF notification_inserted IS TRUE THEN
    BEGIN
      -- FIXED: Use net.http_post instead of extensions.http_post
      PERFORM net.http_post(
        url := 'https://wfmvvpbpuqbzidptxbqx.supabase.co/functions/v1/send-push-notification',
        body := json_build_object(
          'recipient_user_id', NEW.student_id,
          'title', 'Feedback from ' || coach_username,
          'body', 'Your coach has reviewed one of your hands',
          'data', json_build_object(
            'hand_id', NEW.hand_id::text,
            'session_id', hand_session_id::text,
            'type', 'coach_feedback'
          )
        )::text,
        headers := json_build_object(
          'Content-Type', 'application/json'
        )::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to queue push notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;