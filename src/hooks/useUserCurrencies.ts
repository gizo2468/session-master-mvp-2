import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserCurrency {
  currency: string;
  sessionCount: number;
}

export const useUserCurrencies = () => {
  const [currencies, setCurrencies] = useState<UserCurrency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserCurrencies = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          setError('User not authenticated');
          return;
        }

        // Fetch distinct currencies used by the user
        const { data, error: fetchError } = await supabase
          .from('sessions')
          .select('currency')
          .eq('user_id', user.user.id)
          .not('currency', 'is', null);

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        // Count sessions per currency
        const currencyMap = new Map<string, number>();
        
        data?.forEach(session => {
          if (session.currency) {
            currencyMap.set(session.currency, (currencyMap.get(session.currency) || 0) + 1);
          }
        });

        // Convert to array and sort by session count (descending)
        const currencyList = Array.from(currencyMap.entries())
          .map(([currency, sessionCount]) => ({ currency, sessionCount }))
          .sort((a, b) => b.sessionCount - a.sessionCount);

        setCurrencies(currencyList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch currencies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCurrencies();
  }, []);

  return { currencies, isLoading, error };
};