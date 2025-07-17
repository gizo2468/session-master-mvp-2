
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useSessionContext } from '@/context/SessionContext';

const LiveSessionHeader: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSessionsFromDatabase } = useSessionContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleHomeClick = async () => {
    try {
      setIsRefreshing(true);
      await refreshSessionsFromDatabase();
      navigate('/');
    } catch (error) {
      console.error('Failed to refresh session data:', error);
      // Navigate anyway to avoid blocking user
      navigate('/');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-between items-center">
          <Button 
            onClick={handleHomeClick}
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
