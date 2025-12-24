-- Update the get_user_session_statistics function to support currency filtering
CREATE OR REPLACE FUNCTION public.get_user_session_statistics(
  p_user_id uuid, 
  p_timeframe text DEFAULT 'all-time'::text, 
  p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, 
  p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_currency text DEFAULT NULL::text  -- Add currency filter parameter
)
RETURNS TABLE(scope text, net_result numeric, net_hourly_rate numeric, average_net_result numeric, total_buy_ins numeric, total_payouts numeric, average_duration numeric, total_duration numeric, win_ratio numeric, profit_loss_ratio numeric, total_tables integer, hands_count integer, number_of_sessions integer, average_bb100 numeric, final_tables integer, first_place_finish integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  date_filter_start timestamptz;
  date_filter_end timestamptz;
BEGIN
  -- Set date filters based on timeframe
  CASE p_timeframe
    WHEN 'this-month' THEN
      date_filter_start := date_trunc('month', now());
      date_filter_end := now();
    WHEN 'custom' THEN
      date_filter_start := p_start_date;
      date_filter_end := p_end_date;
    ELSE -- 'all-time'
      date_filter_start := NULL;
      date_filter_end := NULL;
  END CASE;

  -- Return statistics for all three scopes with currency filtering
  RETURN QUERY
  WITH session_data AS (
    SELECT 
      s.id,
      s.buy_in,
      s.cash_out,
      s.rebuy_amount,
      s.start_time,
      s.end_time,
      s.big_blind,
      s.currency,
      -- Normalize session format/type
      CASE 
        WHEN LOWER(COALESCE(s.format, '')) LIKE '%tournament%' OR 
             LOWER(COALESCE(s.format, '')) LIKE '%mtt%' THEN 'tournament'
        WHEN LOWER(COALESCE(s.format, '')) LIKE '%cash%' OR 
             LOWER(COALESCE(s.format, '')) LIKE '%home%' OR
             LOWER(COALESCE(s.format, '')) LIKE '%cg%' THEN 'cash'
        ELSE 'cash' -- default to cash for null/unknown
      END as session_type,
      -- Calculate session profit (cash_out - total_investment)
      COALESCE(s.cash_out, 0) - (COALESCE(s.buy_in, 0) + COALESCE(s.rebuy_amount, 0)) as session_profit,
      -- Calculate duration in hours
      CASE 
        WHEN s.end_time IS NOT NULL AND s.start_time IS NOT NULL 
        THEN EXTRACT(epoch FROM (s.end_time - s.start_time)) / 3600.0
        ELSE 0 
      END as duration_hours
    FROM sessions s
    WHERE s.user_id = p_user_id
      AND s.end_time IS NOT NULL -- Only completed sessions
      AND (date_filter_start IS NULL OR s.start_time >= date_filter_start)
      AND (date_filter_end IS NULL OR s.end_time <= date_filter_end)
      AND (p_currency IS NULL OR s.currency = p_currency) -- Add currency filter
  ),
  
  table_data AS (
    SELECT 
      st.session_id,
      COUNT(*) as table_count,
      SUM(COALESCE(st.buy_in, 0) + COALESCE(st.rebuy_amount, 0)) as total_table_buy_ins,
      SUM(COALESCE(st.cashout, 0)) as total_table_payouts,
      -- Tournament specific metrics
      COUNT(CASE WHEN st.final_position IS NOT NULL AND st.final_position <= 9 THEN 1 END) as final_table_count,
      COUNT(CASE WHEN st.final_position = 1 THEN 1 END) as first_place_count
    FROM session_tables st
    WHERE EXISTS (SELECT 1 FROM session_data sd WHERE sd.id = st.session_id)
    GROUP BY st.session_id
  ),
  
  hands_data AS (
    SELECT 
      shn.session_id,
      COUNT(*) as hand_count
    FROM session_hands_new shn
    WHERE EXISTS (SELECT 1 FROM session_data sd WHERE sd.id = shn.session_id)
    GROUP BY shn.session_id
  ),
  
  combined_stats AS (
    SELECT 
      sd.*,
      COALESCE(td.table_count, 1) as table_count, -- At least 1 table per session
      COALESCE(td.total_table_buy_ins, sd.buy_in + COALESCE(sd.rebuy_amount, 0)) as buy_ins,
      COALESCE(td.total_table_payouts, sd.cash_out) as payouts,
      COALESCE(td.final_table_count, 0) as final_tables,
      COALESCE(td.first_place_count, 0) as first_places,
      COALESCE(hd.hand_count, 0) as hands
    FROM session_data sd
    LEFT JOIN table_data td ON sd.id = td.session_id
    LEFT JOIN hands_data hd ON sd.id = hd.session_id
  )
  
  -- Calculate statistics for each scope
  SELECT 
    'all'::text as scope,
    COALESCE(SUM(cs.session_profit), 0) as net_result,
    CASE 
      WHEN SUM(cs.duration_hours) > 0 
      THEN COALESCE(SUM(cs.session_profit), 0) / SUM(cs.duration_hours)
      ELSE 0 
    END as net_hourly_rate,
    CASE 
      WHEN COUNT(*) > 0 
      THEN COALESCE(SUM(cs.session_profit), 0) / COUNT(*)
      ELSE 0 
    END as average_net_result,
    COALESCE(SUM(cs.buy_ins), 0) as total_buy_ins,
    COALESCE(SUM(cs.payouts), 0) as total_payouts,
    CASE 
      WHEN COUNT(*) > 0 
      THEN COALESCE(SUM(cs.duration_hours), 0) / COUNT(*)
      ELSE 0 
    END as average_duration,
    COALESCE(SUM(cs.duration_hours), 0) as total_duration,
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(CASE WHEN cs.session_profit > 0 THEN 1 END)::numeric / COUNT(*)) * 100
      ELSE 0 
    END as win_ratio,
    CASE 
      WHEN SUM(cs.buy_ins) > 0 
      THEN SUM(cs.payouts) / SUM(cs.buy_ins)
      ELSE 0 
    END as profit_loss_ratio,
    COALESCE(SUM(cs.table_count), 0)::integer as total_tables,
    COALESCE(SUM(cs.hands), 0)::integer as hands_count,
    COUNT(*)::integer as number_of_sessions,
    0::numeric as average_bb100, -- Not applicable for combined stats
    COALESCE(SUM(cs.final_tables), 0)::integer as final_tables,
    COALESCE(SUM(cs.first_places), 0)::integer as first_place_finish
  FROM combined_stats cs
  
  UNION ALL
  
  -- Cash games statistics
  SELECT 
    'cash'::text as scope,
    COALESCE(SUM(cs.session_profit), 0) as net_result,
    CASE 
      WHEN SUM(cs.duration_hours) > 0 
      THEN COALESCE(SUM(cs.session_profit), 0) / SUM(cs.duration_hours)
      ELSE 0 
    END as net_hourly_rate,
    CASE 
      WHEN COUNT(*) > 0 
      THEN COALESCE(SUM(cs.session_profit), 0) / COUNT(*)
      ELSE 0 
    END as average_net_result,
    COALESCE(SUM(cs.buy_ins), 0) as total_buy_ins,
    COALESCE(SUM(cs.payouts), 0) as total_payouts,
    CASE 
      WHEN COUNT(*) > 0 
      THEN COALESCE(SUM(cs.duration_hours), 0) / COUNT(*)
      ELSE 0 
    END as average_duration,
    COALESCE(SUM(cs.duration_hours), 0) as total_duration,
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(CASE WHEN cs.session_profit > 0 THEN 1 END)::numeric / COUNT(*)) * 100
      ELSE 0 
    END as win_ratio,
    CASE 
      WHEN SUM(cs.buy_ins) > 0 
      THEN SUM(cs.payouts) / SUM(cs.buy_ins)
      ELSE 0 
    END as profit_loss_ratio,
    COALESCE(SUM(cs.table_count), 0)::integer as total_tables,
    COALESCE(SUM(cs.hands), 0)::integer as hands_count,
    COUNT(*)::integer as number_of_sessions,
    -- BB/100 calculation for cash games
    CASE 
      WHEN SUM(cs.hands) > 0 AND AVG(cs.big_blind) > 0
      THEN (SUM(cs.session_profit) / AVG(cs.big_blind) / SUM(cs.hands)) * 100
      ELSE 0 
    END as average_bb100,
    0::integer as final_tables, -- Not applicable for cash
    0::integer as first_place_finish -- Not applicable for cash
  FROM combined_stats cs
  WHERE cs.session_type = 'cash'
  
  UNION ALL
  
  -- Tournament statistics
  SELECT 
    'tournaments'::text as scope,
    COALESCE(SUM(cs.session_profit), 0) as net_result,
    CASE 
      WHEN SUM(cs.duration_hours) > 0 
      THEN COALESCE(SUM(cs.session_profit), 0) / SUM(cs.duration_hours)
      ELSE 0 
    END as net_hourly_rate,
    CASE 
      WHEN COUNT(*) > 0 
      THEN COALESCE(SUM(cs.session_profit), 0) / COUNT(*)
      ELSE 0 
    END as average_net_result,
    COALESCE(SUM(cs.buy_ins), 0) as total_buy_ins,
    COALESCE(SUM(cs.payouts), 0) as total_payouts,
    CASE 
      WHEN COUNT(*) > 0 
      THEN COALESCE(SUM(cs.duration_hours), 0) / COUNT(*)
      ELSE 0 
    END as average_duration,
    COALESCE(SUM(cs.duration_hours), 0) as total_duration,
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(CASE WHEN cs.session_profit > 0 THEN 1 END)::numeric / COUNT(*)) * 100
      ELSE 0 
    END as win_ratio,
    CASE 
      WHEN SUM(cs.buy_ins) > 0 
      THEN SUM(cs.payouts) / SUM(cs.buy_ins)
      ELSE 0 
    END as profit_loss_ratio,
    COALESCE(SUM(cs.table_count), 0)::integer as total_tables,
    COALESCE(SUM(cs.hands), 0)::integer as hands_count,
    COUNT(*)::integer as number_of_sessions,
    0::numeric as average_bb100, -- Not applicable for tournaments
    COALESCE(SUM(cs.final_tables), 0)::integer as final_tables,
    COALESCE(SUM(cs.first_places), 0)::integer as first_place_finish
  FROM combined_stats cs
  WHERE cs.session_type = 'tournament';
END;
$function$;