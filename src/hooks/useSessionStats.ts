
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

        // Fetch table stats
        const { data: tablesData, error: tablesError } = await supabase
          .from('session_tables')
          .select('buy_in, rebuy_amount, cashout')
          .eq('session_id', sessionId);

        if (tablesError) {
          console.error('Error fetching table stats:', tablesError);
          return;
        }

        // Fetch hands count
        const { count: handsCount, error: handsError } = await supabase
          .from('session_hands')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId);

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
    }
  }, [sessionId]);

  return { stats, loading };
};
