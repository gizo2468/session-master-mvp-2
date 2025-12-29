-- Step 1: Drop existing partial unique indexes
DROP INDEX IF EXISTS notifications_unique_hand_event;
DROP INDEX IF EXISTS notifications_unique_connection_event;

-- Step 2: Add proper UNIQUE CONSTRAINTS (allows ON CONFLICT without WHERE clause)
-- Note: NULL values are treated as distinct in Postgres, so multiple rows with NULL hand_id are allowed
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_unique_hand_event 
UNIQUE (recipient_user_id, type, hand_id);

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_unique_connection_event 
UNIQUE (recipient_user_id, type, connection_id);

-- Step 3: Update create_feedback_notification() to use ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION public.create_feedback_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ON CONFLICT ON CONSTRAINT notifications_unique_hand_event DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Step 4: Update notify_coaches_on_hand_upload() for same stability
CREATE OR REPLACE FUNCTION public.notify_coaches_on_hand_upload()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Create notification for each coach (skip if already exists)
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
    )
    ON CONFLICT ON CONSTRAINT notifications_unique_hand_event DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Step 5: Update create_connection_request_notification() for same stability
CREATE OR REPLACE FUNCTION public.create_connection_request_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sender_username TEXT;
  recipient_id UUID;
BEGIN
  -- Only create notification for new pending requests
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;
  
  -- Get sender's username
  SELECT username INTO sender_username
  FROM profiles 
  WHERE id = NEW.initiated_by;
  
  IF sender_username IS NULL THEN
    sender_username := 'Someone';
  END IF;
  
  -- Determine recipient (the person who didn't initiate)
  IF NEW.initiated_by = NEW.coach_id THEN
    recipient_id := NEW.student_id;
  ELSE
    recipient_id := NEW.coach_id;
  END IF;
  
  -- Create notification (skip if already exists)
  INSERT INTO notifications (
    recipient_user_id,
    sender_user_id,
    type,
    title,
    body,
    connection_id
  ) VALUES (
    recipient_id,
    NEW.initiated_by,
    'connection_request',
    sender_username || ' sent you a connection request',
    'Tap to view and respond',
    NEW.id
  )
  ON CONFLICT ON CONSTRAINT notifications_unique_connection_event DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Step 6: Update create_connection_approved_notification() for same stability
CREATE OR REPLACE FUNCTION public.create_connection_approved_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  approver_username TEXT;
  approver_id UUID;
BEGIN
  -- Only fire when status changes from pending to approved
  IF OLD.status != 'pending' OR NEW.status != 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- The approver is whoever did NOT initiate
  IF NEW.initiated_by = NEW.coach_id THEN
    approver_id := NEW.student_id;
    SELECT username INTO approver_username FROM profiles WHERE id = NEW.student_id;
  ELSE
    approver_id := NEW.coach_id;
    SELECT username INTO approver_username FROM profiles WHERE id = NEW.coach_id;
  END IF;
  
  IF approver_username IS NULL THEN
    approver_username := 'The recipient';
  END IF;
  
  -- Delete the original "connection_request" notification (cleanup stale notification)
  DELETE FROM notifications 
  WHERE connection_id = NEW.id 
    AND type = 'connection_request';
  
  -- Create "approved" notification for the person who initiated (skip if already exists)
  INSERT INTO notifications (
    recipient_user_id,
    sender_user_id,
    type,
    title,
    body,
    connection_id
  ) VALUES (
    NEW.initiated_by,
    approver_id,
    'connection_approved',
    approver_username || ' approved your connection request',
    'You are now connected',
    NEW.id
  )
  ON CONFLICT ON CONSTRAINT notifications_unique_connection_event DO NOTHING;
  
  RETURN NEW;
END;
$function$;