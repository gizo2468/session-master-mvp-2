
import React from 'react';
import { Button } from '@/components/ui/button';

interface SessionHeaderProps {
  isEditing: boolean;
  locationName: string;
  onBackClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  isEditing,
  locationName,
  onBackClick,
  onEditClick,
  onDeleteClick
}) => {
  return (
    <header className="mb-8">
      <Button 
        onClick={onBackClick} 
        variant="ghost" 
        className="text-poker-feltGreen mb-4 flex items-center p-0 hover:bg-transparent"
      >
        ← Back
      </Button>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold">
          {isEditing ? "Edit Session" : locationName}
        </h1>
        {!isEditing && (
          <div className="flex gap-2">
            <button 
              onClick={onEditClick}
              className="text-sm py-1 px-3 border border-gray-300 rounded"
            >
              Edit
            </button>
            <button 
              onClick={onDeleteClick}
              className="text-sm py-1 px-3 border border-red-300 text-poker-red rounded"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default SessionHeader;
