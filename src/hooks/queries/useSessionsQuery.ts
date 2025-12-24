import { useQuery } from '@tanstack/react-query';
import { fetchUserSessions } from '@/utils/database/sessionFetcher';

export const useSessionsQuery = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: fetchUserSessions,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
