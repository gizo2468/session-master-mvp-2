import { useState, useEffect } from 'react';
import { calculateSessionStatisticsFromDB, SessionFormat } from '@/utils/statisticsCalculator';

/**
 * Hook to provide calculated statistics data for all session formats using Supabase
 * This ensures consistent data access across components and prevents recalculation
 */
export const useStatisticsData = (
  timeframe: string = 'all-time',
  startDate?: Date,
  endDate?: Date
) => {
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

        const [allStats, cashStats, tournamentStats] = await Promise.all([
          calculateSessionStatisticsFromDB('all', timeframe, startDate, endDate),
          calculateSessionStatisticsFromDB('cash', timeframe, startDate, endDate),
          calculateSessionStatisticsFromDB('tournament', timeframe, startDate, endDate),
        ]);

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
  }, [timeframe, startDate, endDate]);

  return {
    statisticsData,
    isLoading,
    error,
  };
};