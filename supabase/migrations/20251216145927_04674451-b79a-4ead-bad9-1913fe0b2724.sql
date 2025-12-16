-- Create function to automatically create notification when feedback is added
CREATE OR REPLACE FUNCTION public.create_feedback_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coach_username TEXT;
BEGIN
  -- Get coach username for personalized notification
  SELECT username INTO coach_username
  FROM profiles 
  WHERE id = NEW.coach_id;
  
  IF coach_username IS NULL THEN
    coach_username := 'Your coach';
  END IF;
  
  -- Create notification for the player (student)
  INSERT INTO notifications (
    recipient_user_id,
    sender_user_id,
    type,
    title,
    body,
    hand_id
  ) VALUES (
    NEW.student_id,
    NEW.coach_id,
    'coach_feedback',
    'Feedback from ' || coach_username,
    'Your coach has reviewed one of your hands',
    NEW.hand_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on hand_feedback table
DROP TRIGGER IF EXISTS on_hand_feedback_created ON hand_feedback;
CREATE TRIGGER on_hand_feedback_created
  AFTER INSERT ON hand_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.create_feedback_notification();

-- Backfill: Create notifications for existing feedback that doesn't have one yet
INSERT INTO notifications (recipient_user_id, sender_user_id, type, title, body, hand_id, created_at)
SELECT 
  hf.student_id,
  hf.coach_id,
  'coach_feedback',
  'Feedback from ' || COALESCE(p.username, 'Your coach'),
  'Your coach has reviewed one of your hands',
  hf.hand_id,
  hf.created_at
FROM hand_feedback hf
LEFT JOIN profiles p ON p.id = hf.coach_id
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n 
  WHERE n.hand_id = hf.hand_id 
  AND n.type = 'coach_feedback'
  AND n.recipient_user_id = hf.student_id
);