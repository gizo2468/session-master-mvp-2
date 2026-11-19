DELETE FROM public.notifications WHERE type = 'key_focus_point_created' OR player_goal_id IS NOT NULL;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS player_goal_id;
DROP TABLE IF EXISTS public.player_goals CASCADE;
DROP FUNCTION IF EXISTS public.notify_student_on_goal_created() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_player_goals_student_update() CASCADE;
DROP FUNCTION IF EXISTS public.update_player_goals_updated_at() CASCADE;