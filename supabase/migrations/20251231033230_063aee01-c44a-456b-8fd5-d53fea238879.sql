-- Drop existing INSERT-only trigger
DROP TRIGGER IF EXISTS on_hand_feedback_created ON public.hand_feedback;

-- Recreate trigger to fire on INSERT OR UPDATE
CREATE TRIGGER on_hand_feedback_created
AFTER INSERT OR UPDATE ON public.hand_feedback
FOR EACH ROW
EXECUTE FUNCTION create_feedback_notification();