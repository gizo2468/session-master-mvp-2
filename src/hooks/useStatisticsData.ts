import { useState, useEffect } from 'react';
import { calculateSessionStatisticsFromDB, SessionFormat } from '@/utils/statisticsCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';

/**
 * Hook to provide unified statistics data using the new database function
 * This ensures data consistency between My Finance and Sessions Stats
 */
export const useStatisticsData = (
  timeframe: string = 'all-time',
  startDate?: Date,
  endDate?: Date
) => {
  const { defaultCurrency, isLoading: currencyLoading } = useDefaultCurrency();
  const [statisticsData, setStatisticsData] = useState({
    all: null,
    cash: null,
    tournaments: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      // Don't fetch statistics until currency is loaded
      if (currencyLoading) {
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);

        // Debug: Check authentication status
        const { data: authData } = await supabase.auth.getUser();
        console.log('Current authenticated user:', authData.user?.id);
        console.log('Fetching unified statistics with currency:', defaultCurrency);

        // Use the unified statistics function for consistent data
        // Remove strict currency filtering - let users see all their sessions
        const [allStats, cashStats, tournamentStats] = await Promise.all([
          calculateSessionStatisticsFromDB('all', timeframe, startDate, endDate, null), // No currency filter for broader view
          calculateSessionStatisticsFromDB('cash', timeframe, startDate, endDate, null),
          calculateSessionStatisticsFromDB('tournament', timeframe, startDate, endDate, null),
        ]);

        console.log('Unified statistics fetched:', { allStats, cashStats, tournamentStats, currency: defaultCurrency });

        setStatisticsData({
          all: allStats,
          cash: cashStats,
          tournaments: tournamentStats,
        });
      } catch (err) {
        console.error('Failed to fetch unified statistics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [timeframe, startDate, endDate, defaultCurrency, currencyLoading]);

  return {
    statisticsData,
    isLoading,
    error,
  };
};