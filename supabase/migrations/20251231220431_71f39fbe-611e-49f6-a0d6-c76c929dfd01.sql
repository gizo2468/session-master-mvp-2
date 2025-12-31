-- Function to delete notifications when a session is deleted
CREATE OR REPLACE FUNCTION public.delete_notifications_for_deleted_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete all notifications that reference this session
  DELETE FROM notifications WHERE session_id = OLD.id;
  RETURN OLD;
END;
$$;

-- Trigger: runs BEFORE DELETE so notifications are cleaned up
CREATE TRIGGER on_session_delete_cleanup_notifications
BEFORE DELETE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION delete_notifications_for_deleted_session();