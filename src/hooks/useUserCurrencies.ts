import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { getCurrencyName } from '@/hooks/useDefaultCurrency';

export interface UserCurrency {
  code: string;
  name: string;
  sessionsCount: number;
}

/**
 * Hook to fetch currencies that the user has used in their sessions
 */
export const useUserCurrencies = () => {
  const { user } = useAuth();
  const [currencies, setCurrencies] = useState<UserCurrency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserCurrencies = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch unique currencies from user's sessions
        const { data, error } = await supabase
          .from('sessions')
          .select('currency')
          .eq('user_id', user.id)
          .not('currency', 'is', null)
          .order('currency');

        if (error) {
          throw error;
        }

        // Count occurrences and create currency objects
        const currencyCounts: Record<string, number> = {};
        data.forEach((session) => {
          if (session.currency) {
            currencyCounts[session.currency] = (currencyCounts[session.currency] || 0) + 1;
          }
        });

        // Convert to UserCurrency array and sort by currency code
        const userCurrencies: UserCurrency[] = Object.entries(currencyCounts)
          .map(([code, count]) => ({
            code,
            name: getCurrencyName(code),
            sessionsCount: count,
          }))
          .sort((a, b) => a.code.localeCompare(b.code));

        setCurrencies(userCurrencies);
      } catch (err) {
        console.error('Error fetching user currencies:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch currencies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCurrencies();
  }, [user?.id]);

  return {
    currencies,
    isLoading,
    error,
  };
};