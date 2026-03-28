
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PokerSession } from '@/types/poker';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';

interface EndSessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: PokerSession;
  autoCashOutAmount: number;
  sessionNotes: string;
  onSessionNotesChange: (notes: string) => void;
  onEndSession: () => void;
  currency?: string;
}

export default function EndSessionSheet({
  open,
  onOpenChange,
  session,
  autoCashOutAmount,
  sessionNotes,
  onSessionNotesChange,
  onEndSession,
  currency
}: EndSessionSheetProps) {
  const currencySymbol = getCurrencySymbol(currency);
  const [cashOutAmount, setCashOutAmount] = useState(autoCashOutAmount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEndSession = async () => {
    setIsSubmitting(true);
    try {
      await onEndSession();
      onOpenChange(false);
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cashOut = parseFloat(cashOutAmount) || 0;
  const profit = cashOut - session.buyIn;
  const roi = session.buyIn > 0 ? ((profit / session.buyIn) * 100) : 0;

  // Calculate additional session statistics
  const tablesPlayed = session.tables?.length || 0;
  
  const handsEntered = (session.hands?.length || 0) + 
    (session.tables?.reduce((total, table) => total + (table.hands?.length || 0), 0) || 0);
  
  const cashoutsRecorded = session.tables?.filter(table => 
    !table.isActive && typeof table.cashOut === 'number' && table.cashOut > 0
  ).length || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>End Session</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Session Summary */}
          <div className="bg-gray-50 dark:bg-background rounded-lg p-4">
            <h3 className="font-semibold mb-2">Session Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-muted-foreground">Location:</span>
                <span className="ml-1 font-medium">{session.location}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-muted-foreground">Game:</span>
                <span className="ml-1 font-medium">{session.gameType} {session.format}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-muted-foreground">Buy-in:</span>
                <span className="ml-1 font-medium">{currencySymbol}{session.buyIn.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-muted-foreground">Rebuys:</span>
                <span className="ml-1 font-medium">{session.rebuys || 0}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-muted-foreground">Tables Played:</span>
                <span className="ml-1 font-medium">{tablesPlayed}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-muted-foreground">Hands Entered:</span>
                <span className="ml-1 font-medium">{handsEntered}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-muted-foreground">Cashouts Made:</span>
                <span className="ml-1 font-medium">{cashoutsRecorded}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-muted-foreground">ROI:</span>
                <span className={`ml-1 font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roi.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Cash Out Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cash Out Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 dark:text-muted-foreground">{currencySymbol}</span>
              </div>
              <Input
                type="number"
                placeholder="0.00"
                className="pl-8"
                value={cashOutAmount}
                onChange={(e) => setCashOutAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Profit/Loss Display */}
          {cashOut > 0 && (
            <div className="bg-gray-50 dark:bg-background rounded-lg p-4">
              <h3 className="font-semibold mb-2">Session Results</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-muted-foreground">Profit/Loss:</span>
                  <span className={`ml-1 font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {currencySymbol}{profit.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-muted-foreground">ROI:</span>
                  <span className={`ml-1 font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {roi.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Session Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Notes</label>
            <Textarea
              placeholder="How did your session go? Note any significant hands, reads, or things to improve..."
              className="min-h-[100px]"
              value={sessionNotes}
              onChange={(e) => onSessionNotesChange(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleEndSession}
              disabled={!cashOutAmount || isSubmitting}
              className="flex-1 bg-poker-gold hover:bg-poker-darkGold"
            >
              {isSubmitting ? 'Ending Session...' : 'End Session'}
            </Button>
            
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
