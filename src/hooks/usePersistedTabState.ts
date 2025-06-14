
import { useState, useEffect } from 'react';
import { useUIState } from './useUIState';

interface TabStateConfig {
  screenName: string;
  defaultTab: string;
  sessionId?: string;
}

export const usePersistedTabState = ({ 
  screenName, 
  defaultTab, 
  sessionId 
}: TabStateConfig) => {
  const { state, updateState, isLoading } = useUIState(screenName, sessionId);
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Load persisted tab state
  useEffect(() => {
    if (!isLoading && state.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [state.activeTab, isLoading]);

  const changeTab = async (tabValue: string) => {
    setActiveTab(tabValue);
    await updateState({ activeTab: tabValue });
  };

  return {
    activeTab,
    changeTab,
    isLoading,
  };
};
