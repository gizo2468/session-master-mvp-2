
import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';

const LiveSessionHeader: React.FC = () => {
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();

  return (
    <header className="bg-white dark:bg-card shadow-sm px-4 pb-4 sticky top-0 z-10 relative flex items-center justify-center header-safe pt-4">
      <button 
        onClick={navigateToHomeWithRefresh}
        disabled={isRefreshing}
        className="absolute left-4 flex items-center gap-1 text-poker-feltGreen bg-transparent border-none cursor-pointer p-0 text-sm font-medium"
      >
        <Icon name={isRefreshing ? "Loader2" : "ArrowLeft"} size={16} className={isRefreshing ? 'animate-spin' : ''} />
        <span>Home</span>
      </button>
      <h1 className="text-xl font-bold">Live Session</h1>
    </header>
  );
};

export default LiveSessionHeader;
