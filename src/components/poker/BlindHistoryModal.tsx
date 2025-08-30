import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BBStackUpdateService } from '@/services/bbStackUpdateService';
import { format } from 'date-fns';

interface BBStackUpdate {
  id?: string;
  user_id: string;
  session_id: string;
  table_id: string;
  level?: number;
  stack?: number;
  bb?: number;
  small_blind?: number;
  big_blind?: number;
  created_at?: string;
}

interface BlindHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: BBStackUpdate[];
  tableFormat: string;
}

const BlindHistoryModal: React.FC<BlindHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  tableFormat
}) => {
  const isCashGame = tableFormat === 'Cash';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isCashGame ? 'Blinds History' : 'BB/Stack History'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-96 pr-4">
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No {isCashGame ? 'blinds' : 'BB/Stack'} updates yet.</p>
              </div>
            ) : (
              history.map((update, index) => (
                <div 
                  key={update.id || index} 
                  className="border rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {BBStackUpdateService.formatHistoryLine(update)}
                    </span>
                    {update.created_at && (
                      <span className="text-xs text-gray-500">
                        {format(new Date(update.created_at), 'MMM d, HH:mm')}
                      </span>
                    )}
                  </div>
                  
                  {!isCashGame && (
                    <div className="text-xs text-gray-600 mt-1 space-y-1">
                      {update.level && (
                        <div>Level: {update.level}</div>
                      )}
                      {update.bb && (
                        <div>Big Blind: {update.bb}</div>
                      )}
                      {update.stack && (
                        <div>Stack: {update.stack}</div>
                      )}
                    </div>
                  )}
                  
                  {isCashGame && (
                    <div className="text-xs text-gray-600 mt-1">
                      Small Blind: {update.small_blind} • Big Blind: {update.big_blind}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BlindHistoryModal;