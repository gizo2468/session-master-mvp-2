import { useState, useEffect } from 'react';
import { BBStackUpdateService } from '@/services/bbStackUpdateService';

interface BBStackUpdate {
  id?: string;
  user_id: string;
  session_id: string;
  table_id: string;
  level?: number;
  stack?: number;
  bb?: number;
  small_blind?: number;
  big_blind?: number;
  created_at?: string;
}

export const useBBStackHistory = (tableId: string) => {
  const [history, setHistory] = useState<BBStackUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    if (!tableId) return;
    
    try {
      setIsLoading(true);
      const data = await BBStackUpdateService.getBBStackHistory(tableId);
      setHistory(data);
    } catch (error) {
      console.error('Error loading BB/Stack history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHistory = () => {
    loadHistory();
  };

  useEffect(() => {
    loadHistory();
  }, [tableId]);

  // Listen for global refresh events
  useEffect(() => {
    const handleRefresh = () => {
      refreshHistory();
    };

    window.addEventListener('refreshBlindHistory', handleRefresh);
    return () => {
      window.removeEventListener('refreshBlindHistory', handleRefresh);
    };
  }, []);

  return {
    history,
    isLoading,
    refreshHistory
  };
};