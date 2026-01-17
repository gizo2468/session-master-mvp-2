-- Fix: Prevent trigger from firing when student updates seen_at (liking feedback)
-- Only send notification when coach actually submits/edits feedback

CREATE OR REPLACE FUNCTION public.create_feedback_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  coach_username TEXT;
  hand_session_id UUID;
  notification_id UUID;
BEGIN
  -- IMPORTANT: Only create notification for actual coach feedback events
  -- Skip if this is just a seen_at update (student liking the feedback)
  IF TG_OP = 'UPDATE' THEN
    -- If feedback_content didn't change, this is likely just a seen_at toggle
    -- Don't send notification for that
    IF OLD.feedback_content IS NOT DISTINCT FROM NEW.feedback_content THEN
      RETURN NEW;
    END IF;
  END IF;

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
  
  -- UPSERT notification: insert new or update existing to make it "fresh"
  INSERT INTO notifications (
    recipient_user_id,
    sender_user_id,
    type,
    title,
    body,
    hand_id,
    session_id,
    is_read
  ) VALUES (
    NEW.student_id,
    NEW.coach_id,
    'coach_feedback',
    'Feedback from ' || coach_username,
    'Your coach has reviewed one of your hands',
    NEW.hand_id,
    hand_session_id,
    false
  )
  ON CONFLICT ON CONSTRAINT notifications_unique_hand_event 
  DO UPDATE SET
    is_read = false,
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    created_at = now()
  RETURNING id INTO notification_id;
  
  -- Send push notification for actual coach feedback
  BEGIN
    PERFORM net.http_post(
      url := 'https://wfmvvpbpuqbzidptxbqx.supabase.co/functions/v1/send-push-notification',
      body := json_build_object(
        'recipient_user_id', NEW.student_id,
        'title', 'Feedback from ' || coach_username,
        'body', 'Your coach has reviewed one of your hands',
        'data', json_build_object(
          'hand_id', NEW.hand_id::text,
          'session_id', hand_session_id::text,
          'notification_id', notification_id::text,
          'type', 'coach_feedback'
        )
      )::text,
      headers := json_build_object(
        'Content-Type', 'application/json'
      )::jsonb
    );
    RAISE LOG 'Push notification queued for user % (notification_id: %)', NEW.student_id, notification_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to queue push notification for user %: %', NEW.student_id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;