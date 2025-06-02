
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionStats {
  tables: number;
  hands: number;
  totalBuyIns: number;
  totalPayout: number;
}

export const useSessionStats = (sessionId: string) => {
  const [stats, setStats] = useState<SessionStats>({
    tables: 0,
    hands: 0,
    totalBuyIns: 0,
    totalPayout: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionStats = async () => {
      try {
        setLoading(true);
        console.log('Fetching session stats for sessionId:', sessionId);

        // Fetch table stats
        const { data: tablesData, error: tablesError } = await supabase
          .from('session_tables')
          .select('buy_in, rebuy_amount, cashout')
          .eq('session_id', sessionId);

        console.log('Tables data:', tablesData);
        console.log('Tables error:', tablesError);

        if (tablesError) {
          console.error('Error fetching table stats:', tablesError);
          return;
        }

        // Fetch hands count
        const { count: handsCount, error: handsError } = await supabase
          .from('session_hands')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId);

        console.log('Hands count:', handsCount);
        console.log('Hands error:', handsError);

        if (handsError) {
          console.error('Error fetching hands count:', handsError);
          return;
        }

        // Calculate totals
        const tables = tablesData?.length || 0;
        const hands = handsCount || 0;
        const totalBuyIns = tablesData?.reduce((sum, table) => 
          sum + (table.buy_in || 0) + (table.rebuy_amount || 0), 0) || 0;
        const totalPayout = tablesData?.reduce((sum, table) => 
          sum + (table.cashout || 0), 0) || 0;

        console.log('Calculated stats:', { tables, hands, totalBuyIns, totalPayout });

        setStats({
          tables,
          hands,
          totalBuyIns,
          totalPayout
        });
      } catch (error) {
        console.error('Error in fetchSessionStats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionStats();
    } else {
      console.log('No sessionId provided to useSessionStats');
      setLoading(false);
    }
  }, [sessionId]);

  return { stats, loading };
};
