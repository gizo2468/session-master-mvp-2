
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/', { state: { refresh: true } });
  };

  return (
    <header className="mb-8">
      <Button 
        onClick={handleGoBack} 
        variant="ghost" 
        className="text-poker-feltGreen mb-4 flex items-center p-0 hover:bg-transparent"
      >
        ← Back
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
