-- Harden function search_path for linter compliance (newly added in this migration)
create or replace function public.update_player_goals_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end; $$;