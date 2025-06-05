import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
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

  // Calculate performance metrics
  const performanceMetrics = React.useMemo(() => {
    if (!session?.tables) {
      return {
        tablesPlayed: 0,
        tablesWon: 0,
        tablesLost: 0,
        roi: 0
      };
    }

    const completedTables = session.tables.filter(table => !table.isActive);
    const tablesPlayed = completedTables.length;
    
    let tablesWon = 0;
    let tablesLost = 0;
    let totalTableBuyIn = 0;
    let totalTableCashOut = 0;

    completedTables.forEach(table => {
      const tableBuyIn = (table.buyIn || 0) + (table.rebuyAmount || 0);
      const tableCashOut = table.cashOut || 0;
      
      totalTableBuyIn += tableBuyIn;
      totalTableCashOut += tableCashOut;
      
      if (tableCashOut > tableBuyIn) {
        tablesWon++;
      } else if (tableCashOut < tableBuyIn) {
        tablesLost++;
      }
    });

    // Add session-level buy-in to total
    const sessionBuyIn = session.buyIn || 0;
    const totalInvestment = totalTableBuyIn + sessionBuyIn;
    const totalReturn = totalTableCashOut + autoCashOutAmount;
    
    const roi = totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0;

    return {
      tablesPlayed,
      tablesWon,
      tablesLost,
      roi
    };
  }, [session, autoCashOutAmount]);

  const getRoiColor = (roi: number) => {
    if (roi > 0) return 'text-green-600';
    if (roi < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatRoi = (roi: number) => {
    const sign = roi > 0 ? '+' : '';
    return `${sign}${roi.toFixed(1)}%`;
  };

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
            {/* New Performance Summary Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Session Performance Summary</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="py-2 px-0 text-gray-500 font-medium">Tables Played</TableCell>
                      <TableCell className="py-2 px-0 text-right font-bold">{performanceMetrics.tablesPlayed}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="py-2 px-0 text-gray-500 font-medium">Tables Won</TableCell>
                      <TableCell className="py-2 px-0 text-right font-bold">{performanceMetrics.tablesWon}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="py-2 px-0 text-gray-500 font-medium">Tables Lost</TableCell>
                      <TableCell className="py-2 px-0 text-right font-bold">{performanceMetrics.tablesLost}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="py-2 px-0 text-gray-500 font-medium">ROI</TableCell>
                      <TableCell className={`py-2 px-0 text-right font-bold ${getRoiColor(performanceMetrics.roi)}`}>
                        {formatRoi(performanceMetrics.roi)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Existing Session Summary Section */}
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
