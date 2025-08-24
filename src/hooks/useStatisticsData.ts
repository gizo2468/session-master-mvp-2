import { useMemo } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { calculateSessionStatistics, SessionFormat } from '@/utils/statisticsCalculator';

/**
 * Hook to provide calculated statistics data for all session formats
 * This ensures consistent data access across components and prevents recalculation
 */
export const useStatisticsData = () => {
  const { sessions, isLoading } = useSessionContext();

  const statisticsData = useMemo(() => {
    const allStats = calculateSessionStatistics(sessions, 'all');
    const cashStats = calculateSessionStatistics(sessions, 'cash');
    const tournamentStats = calculateSessionStatistics(sessions, 'tournament');

    return {
      all: allStats,
      cash: cashStats,
      tournaments: tournamentStats,
    };
  }, [sessions]);

  return {
    statisticsData,
    isLoading,
  };
};