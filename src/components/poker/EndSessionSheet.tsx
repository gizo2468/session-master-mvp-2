
import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PokerSession } from '@/types/poker';
import { AlertTriangle, DollarSign } from 'lucide-react';

interface EndSessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: PokerSession;
  autoCashOutAmount: number;
  sessionNotes: string;
  onSessionNotesChange: (notes: string) => void;
  onEndSession: () => void;
}

const EndSessionSheet: React.FC<EndSessionSheetProps> = ({
  open,
  onOpenChange,
  session,
  autoCashOutAmount,
  sessionNotes,
  onSessionNotesChange,
  onEndSession,
}) => {
  const activeTables = session.tables?.filter(table => table.isActive) || [];
  const hasActiveTables = activeTables.length > 0;
  
  // Check if any tables are missing results
  const tablesWithoutResults = session.tables?.filter(table => 
    table.isActive && (table.cashOut === undefined || table.cashOut === null)
  ) || [];

  const profit = autoCashOutAmount - session.buyIn;

  // Calculate additional session statistics
  const tablesPlayed = session.tables?.length || 0;
  
  const handsEntered = (session.hands?.length || 0) + 
    (session.tables?.reduce((total, table) => total + (table.hands?.length || 0), 0) || 0);
  
  const cashoutsRecorded = session.tables?.filter(table => 
    !table.isActive && typeof table.cashOut === 'number' && table.cashOut > 0
  ).length || 0;
  
  const roi = session.buyIn > 0 ? ((profit / session.buyIn) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader className="text-center flex-shrink-0">
          <SheetTitle>End Session</SheetTitle>
          <SheetDescription>
            Review your session details before ending
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {hasActiveTables && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertTriangle size={20} />
                <span className="font-medium">Active Tables Detected</span>
              </div>
              <p className="text-yellow-700 text-sm">
                You have {activeTables.length} active table(s) that need to be ended before you can close this session.
              </p>
              <ul className="mt-2 text-sm text-yellow-700">
                {activeTables.map((table, index) => (
                  <li key={table.id} className="ml-4">
                    • {table.name || table.location || `Table ${index + 1}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {tablesWithoutResults.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertTriangle size={20} />
                <span className="font-medium">Missing Table Results</span>
              </div>
              <p className="text-red-700 text-sm">
                Some tables don't have results entered. Please end these tables properly first.
              </p>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={20} className="text-gray-600" />
              <span className="font-medium text-gray-900">Session Summary</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Total Buy-in</div>
                <div className="font-medium">${session.buyIn.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Cash-out</div>
                <div className="font-medium">${autoCashOutAmount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500">Tables Played</div>
                <div className="font-medium">{tablesPlayed}</div>
              </div>
              <div>
                <div className="text-gray-500">Hands Entered</div>
                <div className="font-medium">{handsEntered}</div>
              </div>
              <div>
                <div className="text-gray-500">Cashouts Made</div>
                <div className="font-medium">{cashoutsRecorded}</div>
              </div>
              <div>
                <div className="text-gray-500">ROI %</div>
                <div className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roi.toFixed(1)}%
                </div>
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-200">
                <div className="text-gray-500">Net Result</div>
                <div className={`font-bold text-lg ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sessionNotes">Session Notes (Optional)</Label>
            <Textarea
              id="sessionNotes"
              placeholder="Add any notes about this session..."
              value={sessionNotes}
              onChange={(e) => onSessionNotesChange(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onEndSession}
            disabled={hasActiveTables || tablesWithoutResults.length > 0}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            End Session
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EndSessionSheet;
