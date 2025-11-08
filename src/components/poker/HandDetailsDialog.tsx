import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HandData } from '@/types/poker';
import CardDisplay from './CardDisplay';
import { CircleDollarSign, Image as ImageIcon } from 'lucide-react';
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
  const [showImageModal, setShowImageModal] = useState(false);
  
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
                <div className="flex items-center gap-2">
                  <CardDisplay cards={hand.cards} size="md" />
                  {(hand.image || hand.handImage) && (
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="p-1.5 rounded hover:bg-accent transition-colors"
                      title="View hand screenshot"
                    >
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Position */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Position:</span>
                <Badge variant="secondary">{hand.position}</Badge>
              </div>
              
              {/* Game Type */}
              {hand.gameType && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-20">Game Type:</span>
                  <Badge variant="secondary">{hand.gameType}</Badge>
                </div>
              )}
              
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
            
            {/* Showdown Result */}
            {hand.showdownResult && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Hand Made:</span>
                <span className="text-sm">{hand.showdownResult}</span>
              </div>
            )}
          </CardContent>
        </Card>

          {/* Additional Details - Placeholders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hand History</CardTitle>
            </CardHeader>
            <CardContent>
              {/* All community cards in one row */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-20">Board:</span>
                <div className="flex gap-1">
                  {hand.flopCards && hand.flopCards.length > 0 ? (
                    <CardDisplay cards={hand.flopCards.join('')} size="sm" />
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No flop</span>
                  )}
                  {hand.turnCard && (
                    <CardDisplay cards={hand.turnCard} size="sm" />
                  )}
                  {hand.riverCard && (
                    <CardDisplay cards={hand.riverCard} size="sm" />
                  )}
                  {!hand.flopCards?.length && !hand.turnCard && !hand.riverCard && (
                    <span className="text-sm text-muted-foreground italic">No data available</span>
                  )}
                </div>
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

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img 
              src={hand?.image || hand?.handImage || ''} 
              alt="Hand screenshot" 
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
          <Button 
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4"
            variant="secondary"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default HandDetailsDialog;