
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { PokerSession } from '@/types/poker';

interface EndSessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: PokerSession | null;
  autoCashOutAmount: number;
  sessionNotes: string;
  onSessionNotesChange: (notes: string) => void;
  onEndSession: () => void;
}

export default function EndSessionSheet({
  open,
  onOpenChange,
  session,
  autoCashOutAmount,
  sessionNotes,
  onSessionNotesChange,
  onEndSession
}: EndSessionSheetProps) {
  // Calculate total buy-in from session and tables
  const totalBuyIn = session ? session.buyIn : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="center" className="max-w-md max-h-[85vh] overflow-auto">
        <SheetHeader>
          <SheetTitle>End Session</SheetTitle>
          <SheetDescription>
            Confirm to end your current poker session.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Session Summary</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Cash Out:</span>
                  <span className="font-bold">${autoCashOutAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Buy In:</span>
                  <span className="font-bold">${totalBuyIn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Profit/Loss:</span>
                  <span className={`font-bold ${
                    autoCashOutAmount > totalBuyIn 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {autoCashOutAmount > totalBuyIn ? '+' : ''}
                    ${(autoCashOutAmount - totalBuyIn).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="sessionNotes" className="block text-sm font-medium text-gray-700">
                Session Notes (Optional)
              </label>
              <Textarea
                id="sessionNotes"
                placeholder="Add any notes about this session..."
                className="mt-1 w-full"
                value={sessionNotes}
                onChange={(e) => onSessionNotesChange(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <SheetFooter className="sm:justify-start gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-poker-gold hover:bg-poker-darkGold text-white"
            onClick={onEndSession}
          >
            End Session
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
