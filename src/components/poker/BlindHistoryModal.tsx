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

  // Group tournament entries by level for display
  const groupedHistory = React.useMemo(() => {
    if (isCashGame) {
      return history.map(update => ({ level: null, updates: [update] }));
    }
    
    // Group by level for tournaments
    const levelGroups = new Map<number, BBStackUpdate[]>();
    
    history
      .filter(update => update.level !== null)
      .forEach(update => {
        const level = update.level!;
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(update);
      });
    
    // Convert to array and sort by level
    return Array.from(levelGroups.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, updates]) => ({
        level,
        updates: updates.sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
      }));
  }, [history, isCashGame]);

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
            {groupedHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No {isCashGame ? 'blinds' : 'BB/Stack'} updates yet.</p>
              </div>
            ) : (
              groupedHistory.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-2">
                  {/* Level Header for tournaments */}
                  {group.level !== null && (
                    <h4 className="font-semibold text-sm border-b pb-1">
                      Level {group.level}
                    </h4>
                  )}
                  
                  {/* Sub-rows for each update in this level/group */}
                  {group.updates.map((update, updateIndex) => (
                    <div 
                      key={`${groupIndex}-${updateIndex}`} 
                      className={`border rounded-lg p-3 bg-gray-50 ${group.level !== null ? 'ml-4' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          {isCashGame ? (
                            <span className="font-medium text-sm">
                              {update.small_blind}/{update.big_blind}
                            </span>
                          ) : (
                            <div className="text-xs text-gray-600 space-y-1">
                              {update.bb && (
                                <div>Big Blind: {update.bb}</div>
                              )}
                              {update.stack && (
                                <div>Stack: {update.stack}</div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {update.created_at && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(update.created_at), 'MMM d, HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
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