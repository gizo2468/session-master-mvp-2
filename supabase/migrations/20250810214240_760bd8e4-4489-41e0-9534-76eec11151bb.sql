-- Create table for coach-assigned goals/tasks to players
create table if not exists public.player_goals (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  student_id uuid not null,
  title text not null,
  details text,
  due_date date,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.player_goals enable row level security;

-- Policies
-- View: coach or player involved
create policy if not exists "Coach or Player can view goals" on public.player_goals
for select using (auth.uid() = coach_id or auth.uid() = student_id);

-- Coach can create goals for approved students
create policy if not exists "Coach can create goals for approved students" on public.player_goals
for insert with check (
  auth.uid() = coach_id
  and exists (
    select 1 from public.coach_student_connections c
    where c.coach_id = coach_id
      and c.student_id = student_id
      and c.status = 'approved'
  )
);

-- Coach can update their goals
create policy if not exists "Coach can update their goals" on public.player_goals
for update using (auth.uid() = coach_id) with check (coach_id = auth.uid());

-- Student can update their goals (restricted by trigger to status only)
create policy if not exists "Student can update own goals" on public.player_goals
for update using (auth.uid() = student_id) with check (student_id = auth.uid());

-- Coach can delete their goals
create policy if not exists "Coach can delete goals" on public.player_goals
for delete using (auth.uid() = coach_id);

-- Trigger: update updated_at
create or replace function public.update_player_goals_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end; $$ language plpgsql;

create trigger trg_player_goals_updated_at
before update on public.player_goals
for each row execute function public.update_player_goals_updated_at();

-- Trigger: prevent student from changing fields other than status
create or replace function public.enforce_player_goals_student_update()
returns trigger as $$
begin
  -- If the updater is the student (and not the coach), only allow status change
  if auth.uid() = old.student_id and auth.uid() != old.coach_id then
    if (new.coach_id is distinct from old.coach_id)
       or (new.student_id is distinct from old.student_id)
       or (new.title is distinct from old.title)
       or (new.details is distinct from old.details)
       or (new.due_date is distinct from old.due_date)
       or (new.created_at is distinct from old.created_at) then
      raise exception 'Only status can be changed by the student';
    end if;
  end if;
  return new;
end; $$ language plpgsql security definer set search_path = public;

create trigger trg_player_goals_student_update
before update on public.player_goals
for each row execute function public.enforce_player_goals_student_update();

-- Helpful indexes
create index if not exists idx_player_goals_student_status_due on public.player_goals (student_id, status, due_date desc);
create index if not exists idx_player_goals_coach_created_at on public.player_goals (coach_id, created_at desc);

-- Realtime
alter table public.player_goals replica identity full;
alter publication supabase_realtime add table if not exists public.player_goals;