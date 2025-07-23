import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PokerSession } from '@/types/poker';
import { format } from 'date-fns';

interface PastSessionConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: PokerSession;
  onClose: () => void;
}

const PastSessionConfirmationModal: React.FC<PastSessionConfirmationModalProps> = ({
  open,
  onOpenChange,
  session,
  onClose
}) => {
  const formatTableDetails = (table: any) => {
    let details = `${table.gameType} • ${table.format}`;
    
    if (table.format === 'Tournament') {
      const tournamentDetails = [];
      
      if (table.tournamentTypes && table.tournamentTypes.length > 0) {
        tournamentDetails.push(...table.tournamentTypes);
      }
      
      if (table.isMultiDay) {
        tournamentDetails.push('Multi-Day');
      }
      
      if (tournamentDetails.length > 0) {
        details += ` (${tournamentDetails.join(', ')})`;
      }
    }
    
    return details;
  };

  const renderFinancialBadges = (table: any) => {
    const initialBuyIn = table.initialBuyIn || table.buyIn || 0;
    const badges = [];

    // Buy-in badge
    badges.push(
      <Badge key="buyin" variant="secondary" className="text-xs">
        Buy-in: ${initialBuyIn.toFixed(2)}
      </Badge>
    );

    // Rebuy badge (if applicable)
    if (table.format === 'Tournament') {
      const rebuyCount = table.rebuys || 0;
      const rebuyAmount = rebuyCount * initialBuyIn;
      
      if (rebuyAmount > 0) {
        badges.push(
          <Badge key="rebuy" variant="destructive" className="text-xs">
            Rebuy: ${rebuyAmount.toFixed(2)}
          </Badge>
        );
      }
    } else {
      const rebuys = table.rebuys || 0;
      
      if (rebuys > 0) {
        badges.push(
          <Badge key="rebuy" variant="destructive" className="text-xs">
            Rebuy: ${rebuys.toFixed(2)}
          </Badge>
        );
      }
    }

    // Cash out badge (if applicable)
    if (table.cashOut !== undefined && table.cashOut > 0) {
      badges.push(
        <Badge key="cashout" variant="outline" className="text-xs text-green-600 border-green-600">
          Cash out: ${table.cashOut.toFixed(2)}
        </Badge>
      );
    }

    return badges;
  };

  const tables = session.tables || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session Added Successfully!</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {tables.map((table, index) => {
            const profit = (table.cashOut || 0) - table.buyIn;
            const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
            const formattedStart = format(new Date(table.startTime), 'MMM d, h:mm a');
            
            return (
              <div
                key={table.id}
                className="border rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 text-center">
                    <h4 className="font-medium text-center">
                      Table {index + 1} - {table.location}
                    </h4>
                    <p className="text-sm text-gray-500 text-center">
                      {formatTableDetails(table)} • {formattedStart}
                    </p>
                  </div>
                  <span className={`font-bold ${profitClass} ml-4`}>
                    {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  {renderFinancialBadges(table)}
                </div>
              </div>
            );
          })}

          {/* Session Summary */}
          {tables.length > 0 && (
            <div className="border-t pt-3 mt-4">
              <div className="text-center space-y-2">
                <h3 className="font-medium">{session.location || 'Poker Session'}</h3>
                <p className="text-sm text-gray-500">
                  {format(session.startTime, 'MMMM d, yyyy')} • 
                  {session.endTime && ` ${format(session.startTime, 'h:mm a')} - ${format(session.endTime, 'h:mm a')}`}
                </p>
                <div className="flex justify-center items-center gap-4 text-sm">
                  <span>Tables: {tables.length}</span>
                  {(() => {
                    const totalBuyIn = tables.reduce((sum, t) => sum + t.buyIn, 0);
                    const totalCashOut = tables.reduce((sum, t) => sum + (t.cashOut || 0), 0);
                    const totalProfit = totalCashOut - totalBuyIn;
                    const profitClass = totalProfit >= 0 ? 'text-green-600' : 'text-red-600';
                    
                    return totalCashOut > 0 ? (
                      <span className={`font-medium ${profitClass}`}>
                        Profit/Loss: {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => { onOpenChange(false); onClose(); }}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PastSessionConfirmationModal;