
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
    navigate('/');
  };

  return (
    <header className="mb-6">
      <Button 
        onClick={handleGoBack} 
        variant="ghost" 
        className="text-poker-feltGreen mb-6 flex items-center p-0 hover:bg-transparent"
      >
        ← Back
      </Button>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            {location}
          </h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            Tournament
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onEditClick}
            className="text-sm py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Edit Tables
          </button>
          <button 
            onClick={onDeleteClick}
            className="text-sm py-2 px-4 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </header>
  );
};

export default SessionDetailHeader;
