-- 1) Add color column to player_goals
ALTER TABLE public.player_goals
ADD COLUMN IF NOT EXISTS color text DEFAULT 'yellow';

-- Backfill existing rows
UPDATE public.player_goals SET color = 'yellow' WHERE color IS NULL;

-- 2) Harden student update guard to include color field
CREATE OR REPLACE FUNCTION public.enforce_player_goals_student_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  -- If the updater is the student (and not the coach), only allow status change
  if auth.uid() = old.student_id and auth.uid() != old.coach_id then
    if (new.coach_id is distinct from old.coach_id)
       or (new.student_id is distinct from old.student_id)
       or (new.title is distinct from old.title)
       or (new.details is distinct from old.details)
       or (new.due_date is distinct from old.due_date)
       or (new.color is distinct from old.color)
       or (new.created_at is distinct from old.created_at) then
      raise exception 'Only status can be changed by the student';
    end if;
  end if;
  return new;
end; $$;