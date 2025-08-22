import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TableData } from '@/types/poker';
import { useNavigate } from 'react-router-dom';

interface HandTableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableData[];
  sessionId: string;
}

const HandTableSelectionModal: React.FC<HandTableSelectionModalProps> = ({
  isOpen,
  onClose,
  tables,
  sessionId
}) => {
  const navigate = useNavigate();
  
  // Filter only active tables
  const activeTables = tables.filter(table => table.isActive);
  
  const handleTableSelect = (tableId: string) => {
    onClose();
    // Navigate to Add Hand page with pre-selected table
    navigate(`/session/${sessionId}/add-hand?tableId=${tableId}`);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Table for Hand</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {activeTables.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No active tables found. Please add a table first.
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Choose which table you want to add a hand to:
              </p>
              
              {activeTables.map((table) => (
                <Button
                  key={table.id}
                  onClick={() => handleTableSelect(table.id)}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                >
                  <div className="text-left">
                    <div className="font-medium">
                      {table.name || `Table ${table.id.slice(-4)}`}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {table.gameType} • {table.format}
                      {table.format === 'Cash' && table.smallBlind && table.bigBlind && (
                        <span> • ${table.smallBlind}/${table.bigBlind}</span>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </>
          )}
          
          <div className="flex justify-end pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HandTableSelectionModal;