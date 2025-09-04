import { useState, useEffect, useCallback } from 'react';
import { calculateSessionStatisticsFromDB, SessionStats } from '@/utils/statisticsCalculator';
import type { FilterOptions } from '@/components/StatisticsFilterModal';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';

/**
 * Unified hook for session statistics
 * This is the single source of truth for all statistics across the application
 * Used by: My Finance, Sessions Stats, PDF Export, and any other statistics components
 */
export const useUnifiedSessionStats = (filters?: FilterOptions) => {
  const { defaultCurrency, isLoading: currencyLoading } = useDefaultCurrency();
  const [statistics, setStatistics] = useState<{
    all: SessionStats | null;
    cash: SessionStats | null;
    tournaments: SessionStats | null;
  }>({
    all: null,
    cash: null,
    tournaments: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert filter options to timeframe and dates for the database function
  const getTimeframeAndDates = useCallback(() => {
    if (!filters) {
      return { timeframe: 'all-time', startDate: undefined, endDate: undefined };
    }

    let timeframe = 'all-time';
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (filters.timeframeType === 'default') {
      timeframe = 'all-time';
    } else if (filters.timeframeType === 'custom') {
      timeframe = 'custom';
      startDate = filters.customStartDate;
      endDate = filters.customEndDate;
    } else if (filters.timeframeValue) {
      const now = new Date();
      
      switch (filters.timeframeValue) {
        case 'This Month':
          timeframe = 'this-month';
          break;
        case 'Last Month':
          timeframe = 'last-month';
          break;
        case 'Last 30 Days':
          timeframe = 'last-30-days';
          break;
        case 'This Week':
          timeframe = 'this-week';
          break;
        case 'Last Week':
          timeframe = 'last-week';
          break;
        case 'Last 7 Days':
          timeframe = 'last-7-days';
          break;
        case 'This Year':
          timeframe = 'this-year';
          break;
        case 'Last Year':
          timeframe = 'last-year';
          break;
        case 'Last 3 Months':
          timeframe = 'custom';
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'Last 90 Days':
          timeframe = 'custom';
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 89);
          endDate = now;
          break;
        default:
          timeframe = 'all-time';
      }
    }

    return { timeframe, startDate, endDate };
  }, [filters]);

  const fetchStatistics = useCallback(async () => {
    if (currencyLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { timeframe, startDate, endDate } = getTimeframeAndDates();

      console.log('Fetching unified statistics with params:', { 
        timeframe, 
        startDate, 
        endDate, 
        filters,
        currency: defaultCurrency 
      });

      // Fetch all three scopes using the unified database function
      // Remove strict currency filtering to allow users to see all their data
      const [allStats, cashStats, tournamentStats] = await Promise.all([
        calculateSessionStatisticsFromDB('all', timeframe, startDate, endDate, null),
        calculateSessionStatisticsFromDB('cash', timeframe, startDate, endDate, null),
        calculateSessionStatisticsFromDB('tournament', timeframe, startDate, endDate, null),
      ]);

      console.log('Unified statistics fetched successfully:', { 
        all: allStats, 
        cash: cashStats, 
        tournaments: tournamentStats 
      });

      setStatistics({
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
  }, [currencyLoading, getTimeframeAndDates, defaultCurrency]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Get statistics for a specific scope
  const getStatsForScope = useCallback((scope: 'all' | 'cash' | 'tournaments') => {
    return statistics[scope];
  }, [statistics]);

  // Refresh statistics manually
  const refreshStatistics = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    getStatsForScope,
    isLoading,
    error,
    refreshStatistics,
    defaultCurrency,
  };
};

export default useUnifiedSessionStats;