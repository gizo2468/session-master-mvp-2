-- Add connection_id column to notifications table for tracking connection-related notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS connection_id UUID;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_notifications_connection_id ON public.notifications(connection_id);

-- Add DELETE policy for notifications (users can delete their own notifications)
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = recipient_user_id);

-- Create trigger function for connection request notifications
CREATE OR REPLACE FUNCTION public.create_connection_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    recipient_id := NEW.student_id;  -- Coach sent to player
  ELSE
    recipient_id := NEW.coach_id;    -- Player sent to coach
  END IF;
  
  -- Create notification
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
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger function for connection approval notifications (includes cleanup)
CREATE OR REPLACE FUNCTION public.create_connection_approved_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    -- Coach initiated, player approved
    approver_id := NEW.student_id;
    SELECT username INTO approver_username FROM profiles WHERE id = NEW.student_id;
  ELSE
    -- Player initiated, coach approved
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
  
  -- Create "approved" notification for the person who initiated
  INSERT INTO notifications (
    recipient_user_id,
    sender_user_id,
    type,
    title,
    body,
    connection_id
  ) VALUES (
    NEW.initiated_by,  -- Notify the person who sent the request
    approver_id,       -- Approver is sender of notification
    'connection_approved',
    approver_username || ' approved your connection request',
    'You are now connected',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new connection requests (INSERT)
DROP TRIGGER IF EXISTS on_connection_request_created ON public.coach_student_connections;
CREATE TRIGGER on_connection_request_created
  AFTER INSERT ON public.coach_student_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.create_connection_request_notification();

-- Create trigger for connection approval (UPDATE)
DROP TRIGGER IF EXISTS on_connection_approved ON public.coach_student_connections;
CREATE TRIGGER on_connection_approved
  AFTER UPDATE ON public.coach_student_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.create_connection_approved_notification();