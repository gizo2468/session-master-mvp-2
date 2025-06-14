
import { useState, useEffect } from 'react';
import { SessionLiveStateService, SessionLiveStateData } from '@/services/sessionLiveState';

export const useSessionLiveState = (sessionId: string) => {
  const [liveState, setLiveState] = useState<SessionLiveStateData>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const loadState = async () => {
      try {
        const state = await SessionLiveStateService.loadState(sessionId);
        if (state) {
          setLiveState(state);
        }
      } catch (error) {
        console.error('Error loading live state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, [sessionId]);

  const updateLiveState = (updates: Partial<SessionLiveStateData>) => {
    const newState = { ...liveState, ...updates };
    setLiveState(newState);
    
    // Debounced save to database
    SessionLiveStateService.debouncedSaveState(sessionId, newState);
  };

  const saveLiveState = async () => {
    return await SessionLiveStateService.saveState(sessionId, liveState);
  };

  const clearLiveState = async () => {
    setLiveState({});
    return await SessionLiveStateService.clearState(sessionId);
  };

  return {
    liveState,
    updateLiveState,
    saveLiveState,
    clearLiveState,
    isLoading
  };
};
