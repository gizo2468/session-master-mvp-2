
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS festival_name TEXT;

CREATE OR REPLACE FUNCTION public.start_session(
  p_game_type text,
  p_format text,
  p_location text,
  p_physical_location text DEFAULT NULL::text,
  p_table_name text DEFAULT NULL::text,
  p_buy_in numeric DEFAULT 0,
  p_small_blind numeric DEFAULT 0,
  p_big_blind numeric DEFAULT 0,
  p_is_online boolean DEFAULT false,
  p_starting_bb integer DEFAULT NULL::integer,
  p_tournament_types text[] DEFAULT NULL::text[],
  p_is_multi_day boolean DEFAULT false,
  p_festival_name text DEFAULT NULL::text
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  new_session_id uuid;
BEGIN
  INSERT INTO public.sessions (
    user_id,
    game_type,
    format,
    location,
    physical_location,
    table_name,
    buy_in,
    initial_buy_in,
    small_blind,
    big_blind,
    is_online,
    starting_bb,
    tournament_types,
    is_multi_day,
    festival_name,
    start_time,
    status,
    is_active,
    current_status
  ) VALUES (
    auth.uid(),
    p_game_type,
    p_format,
    p_location,
    p_physical_location,
    p_table_name,
    p_buy_in,
    p_buy_in,
    p_small_blind,
    p_big_blind,
    p_is_online,
    p_starting_bb,
    p_tournament_types,
    p_is_multi_day,
    p_festival_name,
    now(),
    'active',
    true,
    'running'
  ) RETURNING id INTO new_session_id;

  RETURN new_session_id;
END;
$function$;
