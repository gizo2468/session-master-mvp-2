import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import Icon from '@/components/ui/Lucide';

interface SessionDetailHeaderProps {
  location: string;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const SessionDetailHeader: React.FC<SessionDetailHeaderProps> = ({
  location,
  onEditClick,
  onDeleteClick
}) => {
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();

  return (
    <header className="mb-8">
      <Button 
        onClick={navigateToHomeWithRefresh}
        variant="ghost" 
        className="text-poker-feltGreen mb-4 flex items-center p-0 hover:bg-transparent"
        disabled={isRefreshing}
      >
        <Icon name={isRefreshing ? "Loader2" : "ArrowLeft"} size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        Back
      </Button>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold">
          Session Summary
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={onEditClick}
            className="text-sm py-1 px-3 border border-gray-300 rounded"
          >
            Edit Tables
          </button>
          <button 
            onClick={onDeleteClick}
            className="text-sm py-1 px-3 border border-red-300 text-poker-red rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </header>
  );
};

export default SessionDetailHeader;