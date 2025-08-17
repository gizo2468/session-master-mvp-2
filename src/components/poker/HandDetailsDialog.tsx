import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HandData } from '@/types/poker';
import CardDisplay from './CardDisplay';
import { CircleDollarSign } from 'lucide-react';
import { PokerChip } from '../Icons';
import { Badge } from '@/components/ui/badge';

interface HandDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hand: HandData | null;
  sessionBuyIn?: number;
  tables?: any[];
}

const HandDetailsDialog: React.FC<HandDetailsDialogProps> = ({
  open,
  onOpenChange,
  hand,
  sessionBuyIn,
  tables = []
}) => {
  if (!hand) return null;

  // Find the table this hand belongs to
  const handTable = tables.find(table => table.id === hand.tableId);
  const buyIn = handTable?.buyIn || sessionBuyIn;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Hand Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Main Hand Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hand Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cards */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Cards:</span>
                <CardDisplay cards={hand.cards} size="md" />
              </div>
              
              {/* Position */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Position:</span>
                <Badge variant="secondary">{hand.position}</Badge>
              </div>
              
              {/* Action */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Action:</span>
                <span className="text-sm">{hand.action}</span>
              </div>
              
              {/* Buy-in */}
              {buyIn !== undefined && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-20">Buy-In:</span>
                  <span className="text-sm font-medium">${buyIn.toFixed(2)}</span>
                </div>
              )}
              
              {/* Result */}
              {hand.resultAmount !== undefined && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-20">Result:</span>
                  <div className="flex items-center gap-2">
                    {hand.currencyType === 'currency' ? (
                      <CircleDollarSign className={`h-4 w-4 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    ) : (
                      <PokerChip className={`h-4 w-4 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    )}
                    <span className={`font-medium ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {hand.resultAmount >= 0 ? '+' : ''}
                      {hand.currencyType === 'currency' ? '$' : ''}
                      {Math.abs(hand.resultAmount).toFixed(2)}
                    </span>
                    {(hand.smallBlind !== undefined || hand.bigBlind !== undefined) && (hand.smallBlind || hand.bigBlind) !== 0 && (
                      <span className="text-xs text-muted-foreground">
                        (
                        {hand.currencyType === 'currency' ? '$' : ''}
                        {hand.smallBlind !== undefined ? Number(hand.smallBlind).toString() : '0'}
                        /
                        {hand.currencyType === 'currency' ? '$' : ''}
                        {hand.bigBlind !== undefined ? Number(hand.bigBlind).toString() : '0'}
                        )
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details - Placeholders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hand History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Flop */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Flop:</span>
                <span className="text-sm text-muted-foreground italic">No data available</span>
              </div>
              
              {/* Turn */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Turn:</span>
                <span className="text-sm text-muted-foreground italic">No data available</span>
              </div>
              
              {/* River */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">River:</span>
                <span className="text-sm text-muted-foreground italic">No data available</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {hand.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{hand.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" disabled className="opacity-50">
            Edit
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HandDetailsDialog;