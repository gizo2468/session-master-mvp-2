
import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';

const LiveSessionHeader: React.FC = () => {
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();

  return (
    <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-between items-center">
          <Button 
            onClick={navigateToHomeWithRefresh}
            variant="ghost"
            className="text-poker-feltGreen p-0"
            disabled={isRefreshing}
          >
            <Icon name={isRefreshing ? "Loader2" : "ArrowLeft"} size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Home</span>
          </Button>
          <h1 className="text-xl font-bold">Live Session</h1>
          <div className="w-10"></div>
        </div>
      </div>
    </header>
  );
};

export default LiveSessionHeader;
