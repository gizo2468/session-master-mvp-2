import React, { useState } from 'react';
import { Hand } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TableData, HandData } from '@/types/poker';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/components/ui/use-toast';
import HandForm from './HandForm';

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
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showHandForm, setShowHandForm] = useState(false);
  const { addTableHand } = useSessionContext();
  const { toast } = useToast();
  
  // Filter only active tables
  const activeTables = tables.filter(table => table.isActive);
  
  const handleTableSelect = (tableId: string) => {
    setSelectedTableId(tableId);
    setShowHandForm(true);
    onClose();
  };

  const handleAddHand = (handData: Partial<HandData>) => {
    if (!selectedTableId) return;
    
    try {
      const { tableId: _, ...restHandData } = handData;
      addTableHand(
        sessionId, 
        selectedTableId, 
        restHandData as Omit<HandData, 'id' | 'createdAt' | 'tableId'>
      );
      
      setShowHandForm(false);
      setSelectedTableId(null);
    } catch (error) {
      toast({
        title: 'Error Adding Hand',
        description: 'There was a problem saving the hand data.',
        variant: 'destructive'
      });
      console.error("Error adding hand:", error);
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center justify-center gap-2">
              <Hand className="h-5 w-5" />
              Select Table for Hand
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {activeTables.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-muted-foreground">
                No active tables found. Please add a table first.
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-4">
                  Choose which table you want to add a hand to:
                </p>
                
                {activeTables.map((table) => {
                  const currencySymbol = (() => {
                    switch ((table.currency || 'USD').toUpperCase()) {
                      case 'EUR': return '€';
                      case 'GBP': return '£';
                      case 'ILS': return '₪';
                      default: return '$';
                    }
                  })();
                  const showBuyIn = table.format === 'Tournament' && table.buyIn != null;
                  return (
                    <Button
                      key={table.id}
                      onClick={() => handleTableSelect(table.id)}
                      variant="outline"
                      className="w-full h-auto p-4 flex items-center justify-between gap-3"
                    >
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {table.name || `Table ${table.id.slice(-4)}`}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                          {table.gameType} • {table.format}
                          {table.format === 'Tournament' && table.tournamentTypes && table.tournamentTypes.length > 0 && (
                            <span> • {table.tournamentTypes[0]}</span>
                          )}
                          {table.format === 'Cash' && table.smallBlind && table.bigBlind && (
                            <span> • ${table.smallBlind}/${table.bigBlind}</span>
                          )}
                        </div>
                      </div>
                      {showBuyIn && (
                        <div className="shrink-0 text-right text-sm font-medium text-gray-700 dark:text-muted-foreground">
                          Buy-In: {currencySymbol}{Number(table.buyIn).toFixed(2)}
                        </div>
                      )}
                    </Button>
                  );
                })}

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

      <HandForm
        open={showHandForm}
        onOpenChange={setShowHandForm}
        onSubmit={handleAddHand}
        sessionId={sessionId}
        tableId={selectedTableId || ''}
      />
    </>
  );
};

export default HandTableSelectionModal;