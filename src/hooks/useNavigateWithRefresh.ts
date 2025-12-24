import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useState } from 'react';

/**
 * Custom hook that combines navigation with data refresh
 * Specifically designed for navigating back to home while ensuring fresh data
 */
export const useNavigateWithRefresh = () => {
  const navigate = useNavigate();
  const { refreshSessionsFromDatabase } = useSessionContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Navigate to home page with automatic data refresh
   * Ensures user sees the most up-to-date session data
   */
  const navigateToHomeWithRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // Refresh session data before navigating
      if (refreshSessionsFromDatabase) {
        await refreshSessionsFromDatabase();
      }
      
      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Failed to refresh session data during navigation:', error);
      // Navigate anyway to avoid blocking user
      navigate('/');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Navigate to any path with optional refresh
   * @param path - The path to navigate to
   * @param shouldRefresh - Whether to refresh data before navigation (default: false)
   */
  const navigateWithOptionalRefresh = async (path: string, shouldRefresh: boolean = false) => {
    try {
      if (shouldRefresh) {
        setIsRefreshing(true);
        
        if (refreshSessionsFromDatabase) {
          await refreshSessionsFromDatabase();
        }
      }
      
      navigate(path);
    } catch (error) {
      console.error('Failed to refresh session data during navigation:', error);
      // Navigate anyway to avoid blocking user
      navigate(path);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    navigateToHomeWithRefresh,
    navigateWithOptionalRefresh,
    isRefreshing
  };
};