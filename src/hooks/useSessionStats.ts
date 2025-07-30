
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PokerSession } from '@/types/poker';

interface SessionStats {
  tables: number;
  hands: number;
  totalBuyIns: number;
  totalPayout: number;
}

export const useSessionStats = (sessionId: string, session?: PokerSession) => {
  const [stats, setStats] = useState<SessionStats>({
    tables: 0,
    hands: 0,
    totalBuyIns: 0,
    totalPayout: 0
  });
  const [loading, setLoading] = useState(true);

  // Set up real-time subscription for table updates
  useEffect(() => {
    if (!sessionId) return;

    console.log('🔄 Setting up real-time subscription for session stats:', sessionId);
    
    const channel = supabase
      .channel(`session_stats_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_tables',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('🔄 Real-time session tables update for stats:', payload);
          // Trigger recalculation when tables change
          calculateStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('🔄 Real-time session update for stats:', payload);
          // Trigger recalculation when session changes
          calculateStats();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up session stats real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const calculateStats = async () => {
    try {
      setLoading(true);
      console.log('Calculating session stats for sessionId:', sessionId, 'session:', session);

      // If we have a session object with tables, calculate from local data
      if (session && session.tables && session.tables.length > 0) {
        console.log('Using local session data for stats calculation');
        
        const tables = session.tables.length;
        let hands = 0;
        let totalBuyIns = 0;
        let totalPayout = 0;

        // Calculate from session tables - fix double counting
        session.tables.forEach(table => {
          // Buy-ins: sum of buy_in + rebuys per table (counted once only)
          totalBuyIns += (table.buyIn || 0);
          if (table.rebuys && table.rebuys > 0) {
            // Assuming rebuyAmount is the total rebuy amount, not per rebuy
            totalBuyIns += (table.rebuyAmount || 0);
          }
          
          // Payout: sum of regular cashout + bounty collected for tournaments
          totalPayout += (table.cashOut || 0);
          if (session.format === 'Tournament' && table.bountyAmount && table.bountyCount) {
            totalPayout += (table.bountyAmount * table.bountyCount);
          }
          
          if (table.hands) {
            hands += table.hands.length;
          }
        });

        // Add session-level hands if they exist (but don't double count buy-ins/payouts)
        if (session.hands) {
          hands += session.hands.length;
        }

        console.log('Local stats calculated (fixed):', { tables, hands, totalBuyIns, totalPayout });

        setStats({ tables, hands, totalBuyIns, totalPayout });
        setLoading(false);
        return;
      }

      // Otherwise, try to fetch from Supabase
      console.log('Fetching session stats from Supabase for sessionId:', sessionId);

      // First check the sessions table for tables_played field
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('tables_played')
        .eq('id', sessionId)
        .single();

      console.log('Session tables_played from database:', sessionData?.tables_played);

      // Fetch table stats from Supabase
      const { data: tablesData, error: tablesError } = await supabase
        .from('session_tables')
        .select('buy_in, rebuy_amount, cashout, bounty_amount, players_eliminated, game_format')
        .eq('session_id', sessionId);

      console.log('Supabase tables data:', tablesData);
      console.log('Supabase tables error:', tablesError);

      if (tablesError) {
        console.error('Error fetching table stats:', tablesError);
      }

      // Fetch hands count
      const { count: handsCount, error: handsError } = await supabase
        .from('session_hands')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      console.log('Supabase hands count:', handsCount);
      console.log('Supabase hands error:', handsError);

      if (handsError) {
        console.error('Error fetching hands count:', handsError);
      }

      // Calculate totals from Supabase data (with fixed logic)
      // Use tables_played from sessions table if available, otherwise fall back to actual table count
      const tables = sessionData?.tables_played || tablesData?.length || 0;
      const hands = handsCount || 0;
      
      let totalBuyIns = 0;
      let totalPayout = 0;
      
      if (tablesData) {
        tablesData.forEach(table => {
          // Buy-ins: sum of buy_in + rebuy_amount per table
          totalBuyIns += (table.buy_in || 0) + (table.rebuy_amount || 0);
          
          // Payout: sum of cashout + bounty earnings for tournaments
          totalPayout += (table.cashout || 0);
          if (table.game_format === 'Tournament' && table.bounty_amount && table.players_eliminated) {
            totalPayout += (table.bounty_amount * table.players_eliminated);
          }
        });
      }

      console.log('Supabase stats calculated (fixed):', { tables, hands, totalBuyIns, totalPayout });

      setStats({
        tables,
        hands,
        totalBuyIns,
        totalPayout
      });
    } catch (error) {
      console.error('Error in calculateStats:', error);
      // Set default values on error
      setStats({
        tables: 0,
        hands: 0,
        totalBuyIns: 0,
        totalPayout: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      calculateStats();
    } else {
      console.log('No sessionId provided to useSessionStats');
      setLoading(false);
    }
  }, [sessionId, session]);

  return { stats, loading };
};
