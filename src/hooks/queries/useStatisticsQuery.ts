import { useQuery } from '@tanstack/react-query';
import { calculateSessionStatisticsFromDB, SessionFormat } from '@/utils/statisticsCalculator';

export const useStatisticsQuery = (
  format: SessionFormat,
  timeframe: string = 'all-time',
  startDate?: Date,
  endDate?: Date,
  currency?: string | null
) => {
  return useQuery({
    queryKey: ['statistics', format, timeframe, startDate, endDate, currency],
    queryFn: () => calculateSessionStatisticsFromDB(format, timeframe, startDate, endDate, currency),
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};
