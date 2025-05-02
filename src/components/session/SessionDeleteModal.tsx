
import React from 'react';
import { Button } from '@/components/ui/button';

interface SessionDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

const SessionDeleteModal: React.FC<SessionDeleteModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirmDelete 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Delete Session</h2>
        <p className="mb-6">Are you sure you want to delete this session? This action cannot be undone.</p>
        
        <div className="flex gap-4">
          <Button
            onClick={onConfirmDelete}
            className="flex-1 py-2 px-4 bg-poker-red hover:bg-red-700 text-white font-bold rounded-md"
          >
            Delete
          </Button>
          
          <Button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionDeleteModal;
