-- Create RPC function to fetch active session tables with proper security
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
    AND s.user_id = auth.uid();
$$;

-- Create partial index for performance on active tables
CREATE INDEX IF NOT EXISTS idx_session_tables_session_end_null 
ON session_tables(session_id) 
WHERE end_time IS NULL;

-- Ensure FK constraint exists (use DO block to avoid error if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'session_tables_session_id_fkey'
    AND table_name = 'session_tables'
  ) THEN
    ALTER TABLE session_tables 
    ADD CONSTRAINT session_tables_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
  END IF;
END $$;