-- Enable pg_net extension for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update the create_feedback_notification function to also send push notifications
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
  -- Use ON CONFLICT to gracefully skip if notification already exists for this hand
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
  
  -- Only send push notification if a new notification was actually created (not a duplicate)
  IF notification_inserted IS TRUE THEN
    -- Call edge function asynchronously to send push notification
    -- This is best-effort and won't block or fail the transaction
    BEGIN
      PERFORM extensions.http_post(
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
      -- Log but don't fail - push is best effort
      RAISE WARNING 'Failed to queue push notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;