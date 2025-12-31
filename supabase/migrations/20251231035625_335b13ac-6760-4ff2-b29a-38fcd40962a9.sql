-- Step A: Fix create_feedback_notification() with correct net.http_post signature
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
  
  RAISE LOG '[create_feedback_notification] Notification upserted: id=%, recipient=%, type=coach_feedback', notification_id, NEW.student_id;
  
  -- Push will now be sent by the trigger on notifications table
  -- No need to call net.http_post here anymore
  
  RETURN NEW;
END;
$function$;

-- Step B: Create trigger function for notifications table
CREATE OR REPLACE FUNCTION public.send_push_for_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://wfmvvpbpuqbzidptxbqx.supabase.co';
BEGIN
  -- Only send push for fresh/unread notifications
  -- On INSERT: always send
  -- On UPDATE: only if notification is being "refreshed" (is_read changed to false, or content changed)
  IF TG_OP = 'UPDATE' THEN
    -- Skip if notification is being marked as read (not a new alert)
    IF NEW.is_read = true THEN
      RAISE LOG '[send_push_for_notification] Skipping push: notification % marked as read', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Skip if nothing meaningful changed
    IF OLD.is_read = NEW.is_read 
       AND OLD.title = NEW.title 
       AND OLD.body IS NOT DISTINCT FROM NEW.body 
       AND OLD.created_at = NEW.created_at THEN
      RAISE LOG '[send_push_for_notification] Skipping push: no meaningful change for notification %', NEW.id;
      RETURN NEW;
    END IF;
  END IF;
  
  RAISE LOG '[send_push_for_notification] Sending push for notification: id=%, recipient=%, type=%', NEW.id, NEW.recipient_user_id, NEW.type;
  
  -- Call Edge Function with CORRECT net.http_post signature (body as jsonb, include params and timeout)
  BEGIN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      body := jsonb_build_object(
        'recipient_user_id', NEW.recipient_user_id,
        'title', NEW.title,
        'body', COALESCE(NEW.body, ''),
        'data', jsonb_build_object(
          'notification_id', NEW.id::text,
          'type', NEW.type,
          'hand_id', COALESCE(NEW.hand_id::text, ''),
          'session_id', COALESCE(NEW.session_id::text, ''),
          'connection_id', COALESCE(NEW.connection_id::text, '')
        )
      ),
      params := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      timeout_milliseconds := 10000
    );
    RAISE LOG '[send_push_for_notification] Push queued successfully for notification %', NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[send_push_for_notification] Failed to queue push for notification %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;

-- Step C: Create trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_send_push ON public.notifications;

CREATE TRIGGER on_notification_send_push
AFTER INSERT OR UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION send_push_for_notification();