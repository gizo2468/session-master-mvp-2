import { useState, useEffect } from 'react';
import { calculateSessionStatisticsFromDB, SessionFormat } from '@/utils/statisticsCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';

/**
 * Hook to provide calculated statistics data for all session formats using Supabase
 * This ensures consistent data access across components and prevents recalculation
 * Now automatically filters by user's default currency for consistent data isolation
 */
export const useStatisticsData = (
  timeframe: string = 'all-time',
  startDate?: Date,
  endDate?: Date
) => {
  const { defaultCurrency } = useDefaultCurrency();
  const [statisticsData, setStatisticsData] = useState({
    all: null,
    cash: null,
    tournaments: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Debug: Check authentication status
        const { data: authData } = await supabase.auth.getUser();
        console.log('Current authenticated user:', authData.user?.id);

        // Pass user's default currency to ensure proper filtering at database level
        const [allStats, cashStats, tournamentStats] = await Promise.all([
          calculateSessionStatisticsFromDB('all', timeframe, startDate, endDate, defaultCurrency),
          calculateSessionStatisticsFromDB('cash', timeframe, startDate, endDate, defaultCurrency),
          calculateSessionStatisticsFromDB('tournament', timeframe, startDate, endDate, defaultCurrency),
        ]);

        console.log('Statistics fetched:', { allStats, cashStats, tournamentStats });

        setStatisticsData({
          all: allStats,
          cash: cashStats,
          tournaments: tournamentStats,
        });
      } catch (err) {
        console.error('Failed to fetch statistics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [timeframe, startDate, endDate, defaultCurrency]); // Add defaultCurrency as dependency

  return {
    statisticsData,
    isLoading,
    error,
  };
};