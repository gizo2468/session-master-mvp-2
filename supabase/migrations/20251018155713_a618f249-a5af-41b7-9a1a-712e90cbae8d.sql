-- Fix the RPC function to properly handle auth context
CREATE OR REPLACE FUNCTION public.get_active_session_tables(p_session_id uuid)
RETURNS TABLE (
  id uuid,
  session_id uuid,
  user_id uuid,
  table_name text,
  table_type text,
  game_format text,
  stakes text,
  buy_in numeric,
  starting_stack integer,
  current_stack integer,
  rebuys integer,
  rebuy_amount numeric,
  bounty_amount numeric,
  players_eliminated integer,
  final_position integer,
  cashout numeric,
  start_time timestamptz,
  end_time timestamptz,
  start_time_utc bigint,
  end_time_utc bigint,
  is_active boolean,
  currency text,
  tournament_type text,
  table_notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- If no authenticated user, return empty
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return active tables for the session that belong to the authenticated user
  RETURN QUERY
  SELECT 
    st.id,
    st.session_id,
    st.user_id,
    st.table_name,
    st.table_type,
    st.game_format,
    st.stakes,
    st.buy_in,
    st.starting_stack,
    st.current_stack,
    st.rebuys,
    st.rebuy_amount,
    st.bounty_amount,
    st.players_eliminated,
    st.final_position,
    st.cashout,
    st.start_time,
    st.end_time,
    st.start_time_utc,
    st.end_time_utc,
    st.is_active,
    st.currency,
    st.tournament_type,
    st.table_notes,
    st.created_at,
    st.updated_at
  FROM session_tables st
  INNER JOIN sessions s ON s.id = st.session_id
  WHERE st.session_id = p_session_id
    AND st.end_time IS NULL
    AND s.user_id = current_user_id
    AND st.user_id = current_user_id;
END;
$$;