import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BBStackUpdateRecord } from '@/services/bbStackUpdateService';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { format } from 'date-fns';

interface BlindHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: BBStackUpdateRecord[];
  currency?: string;
  tableFormat: string;
  tableName?: string;
}

const BlindHistoryModal: React.FC<BlindHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  currency = 'USD',
  tableFormat,
  tableName
}) => {
  const currencySymbol = getCurrencySymbol(currency);
  const isCashTable = tableFormat === 'Cash';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Blind History - {tableName || 'Table'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {history.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No blind updates recorded yet.</p>
              </div>
            )}
            
            {history.map((update, index) => (
              <div key={update.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-500">
                    {format(new Date(update.created_at), 'MMM dd, HH:mm')}
                  </div>
                  <div className="text-xs text-gray-400">
                    #{history.length - index}
                  </div>
                </div>
                
                {isCashTable ? (
                  <div className="text-sm">
                    <span className="text-gray-600">Blinds: </span>
                    <span className="font-medium">
                      {currencySymbol}{update.small_blind}/{currencySymbol}{update.big_blind}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-gray-600">Level: </span>
                      <span className="font-medium">{update.level || 1}</span>
                    </div>
                    {update.bb && (
                      <div>
                        <span className="text-gray-600">BB: </span>
                        <span className="font-medium">{update.bb}</span>
                      </div>
                    )}
                    {update.stack && (
                      <div>
                        <span className="text-gray-600">Stack: </span>
                        <span className="font-medium">{update.stack.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BlindHistoryModal;