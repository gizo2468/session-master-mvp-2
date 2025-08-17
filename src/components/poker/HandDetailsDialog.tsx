import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HandData } from '@/types/poker';
import CardDisplay from './CardDisplay';
import { CircleDollarSign, Image, Video, MessageSquare } from 'lucide-react';
import { PokerChip } from '../Icons';

interface HandDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hand: HandData | null;
}

const HandDetailsDialog: React.FC<HandDetailsDialogProps> = ({ 
  open, 
  onOpenChange, 
  hand 
}) => {
  if (!hand) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hand Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cards Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Cards</h3>
                <div className="flex items-center gap-3">
                  <CardDisplay cards={hand.cards} size="lg" />
                  <div className="flex items-center gap-2">
                    {hand.image && (
                      <Badge variant="outline" className="gap-1">
                        <Image size={14} />
                        Image Available
                      </Badge>
                    )}
                    {hand.pokercraftLink && (
                      <Badge variant="outline" className="gap-1">
                        <Video size={14} />
                        Video Available
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position & Action */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Position</h3>
                  <Badge variant="secondary" className="text-sm">
                    {hand.position}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Action Taken</h3>
                  <p className="text-sm">{hand.action}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result */}
          {hand.resultAmount !== undefined && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Result</h3>
                  <div className="flex items-center gap-2">
                    {hand.currencyType === 'currency' ? (
                      <CircleDollarSign className={`h-5 w-5 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    ) : (
                      <PokerChip className={`h-5 w-5 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    )}
                    <span className={`text-lg font-medium ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {hand.resultAmount >= 0 ? '+' : ''}
                      {hand.currencyType === 'currency' ? '$' : ''}
                      {Math.abs(hand.resultAmount).toFixed(2)}
                    </span>
                    {(hand.smallBlind !== undefined || hand.bigBlind !== undefined) && (hand.smallBlind || hand.bigBlind) !== 0 && (
                      <span className="text-sm text-muted-foreground">
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
              </CardContent>
            </Card>
          )}

          {/* Additional Fields - Placeholders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Flop</h3>
                  <p className="text-sm text-muted-foreground italic">Not available</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Turn</h3>
                  <p className="text-sm text-muted-foreground italic">Not available</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">River</h3>
                  <p className="text-sm text-muted-foreground italic">Not available</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Pot Size</h3>
                  <p className="text-sm text-muted-foreground italic">Not available</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {hand.notes && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare size={16} />
                    Notes
                  </h3>
                  <p className="text-sm">{hand.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" disabled>
              Edit
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HandDetailsDialog;