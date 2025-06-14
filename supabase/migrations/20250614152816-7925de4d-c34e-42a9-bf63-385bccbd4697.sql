
-- First, let's update the sessions table to match the PokerSession interface
ALTER TABLE public.sessions DROP COLUMN IF EXISTS session_type;
ALTER TABLE public.sessions DROP COLUMN IF EXISTS game_type;
ALTER TABLE public.sessions DROP COLUMN IF EXISTS notes;

-- Add all the required columns for poker sessions
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS game_type text NOT NULL DEFAULT 'NLH',
ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'Cash',
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS physical_location text,
ADD COLUMN IF NOT EXISTS table_name text,
ADD COLUMN IF NOT EXISTS buy_in numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS initial_buy_in numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_out numeric,
ADD COLUMN IF NOT EXISTS small_blind numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS big_blind numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rebuys integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS rebuy_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_duration integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS current_status text DEFAULT 'running',
ADD COLUMN IF NOT EXISTS starting_bb integer,
ADD COLUMN IF NOT EXISTS tournament_types text[],
ADD COLUMN IF NOT EXISTS is_multi_day boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS roi numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS itm_ratio_numerator integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS itm_ratio_denominator integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tables_played integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active','completed','paused')) DEFAULT 'active';

-- Create the session_live_state table for volatile UI information
CREATE TABLE IF NOT EXISTS public.session_live_state (
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id)   ON DELETE CASCADE,
  state      jsonb         DEFAULT '{}',
  updated_at timestamptz   DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_live_state ENABLE ROW LEVEL SECURITY;

-- RLS policies for sessions table
DROP POLICY IF EXISTS "User can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "User can modify own sessions" ON public.sessions;

CREATE POLICY "User can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User can modify own sessions"
  ON public.sessions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for session_live_state table
CREATE POLICY "User can view own live state"
  ON public.session_live_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User can modify own live state"
  ON public.session_live_state FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to start a new session
CREATE OR REPLACE FUNCTION public.start_session(
  p_game_type text,
  p_format text,
  p_location text,
  p_physical_location text DEFAULT NULL,
  p_table_name text DEFAULT NULL,
  p_buy_in numeric DEFAULT 0,
  p_small_blind numeric DEFAULT 0,
  p_big_blind numeric DEFAULT 0,
  p_is_online boolean DEFAULT false,
  p_starting_bb integer DEFAULT NULL,
  p_tournament_types text[] DEFAULT NULL,
  p_is_multi_day boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    now(),
    'active',
    true,
    'running'
  ) RETURNING id INTO new_session_id;
  
  RETURN new_session_id;
END;
$$;

-- Create function to end a session
CREATE OR REPLACE FUNCTION public.end_session(
  p_session_id uuid,
  p_cash_out numeric,
  p_notes text DEFAULT NULL,
  p_roi numeric DEFAULT 0,
  p_itm_ratio_numerator integer DEFAULT 0,
  p_itm_ratio_denominator integer DEFAULT 0,
  p_tables_played integer DEFAULT 0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the session
  UPDATE public.sessions SET 
    cash_out = p_cash_out,
    roi = p_roi,
    itm_ratio_numerator = p_itm_ratio_numerator,
    itm_ratio_denominator = p_itm_ratio_denominator,
    tables_played = p_tables_played,
    notes = COALESCE(p_notes, notes),
    end_time = now(),
    status = 'completed',
    is_active = false,
    current_status = 'ended'
  WHERE id = p_session_id AND user_id = auth.uid();
  
  -- Clean up live state
  DELETE FROM public.session_live_state 
  WHERE session_id = p_session_id AND user_id = auth.uid();
  
  RETURN true;
END;
$$;

-- Add trigger to update session_live_state timestamp
CREATE OR REPLACE FUNCTION update_session_live_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_session_live_state_updated_at ON public.session_live_state;
CREATE TRIGGER trigger_update_session_live_state_updated_at
  BEFORE UPDATE ON public.session_live_state
  FOR EACH ROW
  EXECUTE FUNCTION update_session_live_state_updated_at();
