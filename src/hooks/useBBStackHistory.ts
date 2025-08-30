import { useState, useEffect } from 'react';
import { BBStackUpdateService, BBStackUpdateRecord } from '@/services/bbStackUpdateService';

export const useBBStackHistory = (sessionId: string) => {
  const [updateHistory, setUpdateHistory] = useState<Record<string, BBStackUpdateRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const history = await BBStackUpdateService.getSessionUpdateHistory(sessionId);
        setUpdateHistory(history);
      } catch (error) {
        console.error('Error loading BB/Stack update history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [sessionId]);

  const addUpdate = (tableId: string, update: BBStackUpdateRecord) => {
    setUpdateHistory(prev => ({
      ...prev,
      [tableId]: [...(prev[tableId] || []), update]
    }));
  };

  const getTableHistory = (tableId: string): BBStackUpdateRecord[] => {
    return updateHistory[tableId] || [];
  };

  const getLatestUpdate = (tableId: string): BBStackUpdateRecord | null => {
    const history = getTableHistory(tableId);
    return history.length > 0 ? history[history.length - 1] : null;
  };

  return {
    updateHistory,
    isLoading,
    addUpdate,
    getTableHistory,
    getLatestUpdate,
    refreshHistory: () => {
      if (sessionId) {
        BBStackUpdateService.getSessionUpdateHistory(sessionId).then(setUpdateHistory);
      }
    }
  };
};