
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/Lucide';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { TableData } from '@/types/poker';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';

interface EndTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableData | null;
  cashOutAmount: string;
  onCashOutAmountChange: (amount: string) => void;
  tableNotes: string;
  onTableNotesChange: (notes: string) => void;
  bountyCount: string;
  onBountyCountChange: (count: string) => void;
  bountyAmount: string;
  onBountyAmountChange: (amount: string) => void;
  finalPosition: string;
  onFinalPositionChange: (position: string) => void;
  endReason: 'eliminated' | 'day-ended' | null;
  onEndReasonChange: (reason: 'eliminated' | 'day-ended' | null) => void;
  nextDayStart: Date | null;
  onNextDayStartChange: (date: Date | null) => void;
  chipsCarryover: string;
  onChipsCarryoverChange: (chips: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  currency?: string;
}

export default function EndTableDialog({
  open,
  onOpenChange,
  table,
  cashOutAmount,
  onCashOutAmountChange,
  tableNotes,
  onTableNotesChange,
  bountyCount,
  onBountyCountChange,
  bountyAmount,
  onBountyAmountChange,
  finalPosition,
  onFinalPositionChange,
  endReason,
  onEndReasonChange,
  nextDayStart,
  onNextDayStartChange,
  chipsCarryover,
  onChipsCarryoverChange,
  onConfirm,
  onCancel,
  currency
}: EndTableDialogProps) {
  const currencySymbol = getCurrencySymbol(currency);
  
  // Helper function to check if a table is a multi-day tournament
  const isMultiDayTournament = (table: TableData) => {
    return table.format === 'Tournament' && table.isMultiDay === true;
  };

  // Helper function to check if a table is a bounty tournament
  const isBountyTournament = (table: TableData) => {
    return table.format === 'Tournament' && 
      table.tournamentTypes?.some(type => 
        ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
      );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-tour="end-table-intro"
        onPointerDownOutside={(e) => {
          if ((e.target as Element | null)?.closest('[data-onboarding-tour="true"]')) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if ((e.target as Element | null)?.closest('[data-onboarding-tour="true"]')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>End Table</DialogTitle>
          <DialogDescription>
            {table && isMultiDayTournament(table) && table.format === 'Tournament' && !endReason
              ? "Are you ending this multi-day tournament table because you were eliminated or because the day has ended?"
              : "Enter your cash out amount to complete this table."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4" data-tour="end-table-cashout">
          {table && isMultiDayTournament(table) && table.format === 'Tournament' && !endReason && (
            <div className="flex flex-col gap-4 mb-6">
              <Button
                variant="outline"
                className="w-full py-6 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onEndReasonChange('eliminated')}
              >
                <Icon name="X" className="mr-2 h-5 w-5" /> Eliminated (Cash Out)
              </Button>
              <Button
                variant="outline"
                className="w-full py-6 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => onEndReasonChange('day-ended')}
              >
                <Icon name="Calendar" className="mr-2 h-5 w-5" /> Day Ended (Continuing)
              </Button>
            </div>
          )}
          
          {(!table || 
            !isMultiDayTournament(table) ||
            endReason === 'eliminated' ||
            table.format === 'Cash') && (
            <div className="space-y-4">
              <div>
                <label htmlFor="tableCashout" className="block text-sm font-medium mb-1">
                  Total Payout
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-muted-foreground">{currencySymbol}</span>
                  </div>
                  <input
                    data-tour="end-table-cashout-input"
                    id="tableCashout"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-border rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
                    placeholder="0.00"
                    value={cashOutAmount}
                    onChange={(e) => onCashOutAmountChange(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Enter the total amount you received (including all earnings)</p>
              </div>

              {table && table.format === 'Tournament' && endReason !== 'day-ended' && (
                <div>
                  <label htmlFor="finalPosition" className="block text-sm font-medium mb-1">
                    Final Position (Optional)
                  </label>
                  <input
                    id="finalPosition"
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
                    placeholder="Enter your final position (e.g. 3 for 3rd)"
                    value={finalPosition}
                    onChange={(e) => onFinalPositionChange(e.target.value)}
                  />
                </div>
              )}

              {table && isBountyTournament(table) && endReason !== 'day-ended' && (
                <>
                  <div>
                    <label htmlFor="bountyCount" className="block text-sm font-medium mb-1">
                      Players Eliminated (Optional)
                    </label>
                    <input
                      id="bountyCount"
                      type="number"
                      min="0"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
                      placeholder="Number of players eliminated"
                      value={bountyCount}
                      onChange={(e) => onBountyCountChange(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bountyAmount" className="block text-sm font-medium mb-1">
                      Total Bounty Collected (Optional)
                    </label>
                    <div className="flex rounded-md shadow-sm dark:shadow-black/20">
                      <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 dark:text-muted-foreground bg-gray-50 dark:bg-background border border-r-0 border-gray-300 dark:border-border rounded-l-md">
                        {currencySymbol}
                      </span>
                      <input
                        id="bountyAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-border rounded-r-md focus:ring-poker-feltGreen focus:border-poker-feltGreen focus:outline-none bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
                        placeholder="0.00"
                        value={bountyAmount}
                        onChange={(e) => onBountyAmountChange(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {endReason !== 'day-ended' && (
                <div className="mb-6" data-tour="end-table-profit">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Profit/Loss:</span>
                    <span className={`text-sm font-bold ${
                      cashOutAmount && table?.buyIn && 
                      parseFloat(cashOutAmount) >= table.buyIn
                        ? 'text-green-600' 
                        : cashOutAmount 
                          ? 'text-red-600' 
                          : 'text-gray-500 dark:text-muted-foreground'
                    }`}>
                      {cashOutAmount && table
                        ? `${currencySymbol}${(parseFloat(cashOutAmount) - table.buyIn).toFixed(2)}` 
                        : `${currencySymbol}0.00`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-muted rounded-full overflow-hidden">
                    {cashOutAmount && table && (
                      <div 
                        className={`h-full ${
                          parseFloat(cashOutAmount) >= table.buyIn
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ 
                          width: cashOutAmount 
                            ? `${Math.min(Math.abs((parseFloat(cashOutAmount) - table.buyIn) / 
                                table.buyIn * 100), 100)}%` 
                            : '0%' 
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              
              <div data-tour="end-table-notes">
                <label htmlFor="tableNotes" className="block text-sm font-medium mb-1">
                  Notes (Optional)
                </label>
                <Textarea
                  id="tableNotes"
                  className="w-full min-h-[100px] border border-gray-300 dark:border-border rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
                  placeholder="Table notes"
                  value={tableNotes}
                  onChange={(e) => onTableNotesChange(e.target.value)}
                  autoComplete="off"
                  data-form-type="other"
                />
              </div>
            </div>
          )}
          
          {endReason === 'day-ended' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="nextDayStart" className="block text-sm font-medium mb-1">
                  Next Day Start (Optional)
                </label>
                <input
                  id="nextDayStart"
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
                  value={nextDayStart ? nextDayStart.toISOString().slice(0, 16) : ''}
                  onChange={(e) => onNextDayStartChange(e.target.value ? new Date(e.target.value) : null)}
                />
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  When does the next day of this tournament begin?
                </p>
              </div>
              
              <div>
                <label htmlFor="chipsCarryover" className="block text-sm font-medium mb-1">
                  Chips Carryover
                </label>
                <input
                  id="chipsCarryover"
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-border rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
                  placeholder="Enter chip count"
                  value={chipsCarryover}
                  onChange={(e) => onChipsCarryoverChange(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                  How many chips are you carrying over to the next day?
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            data-tour="end-table-confirm"
            className="bg-poker-gold hover:bg-poker-darkGold text-white"
            onClick={onConfirm}
            disabled={(endReason !== 'day-ended' && !cashOutAmount) || 
                      (endReason === 'day-ended' && !chipsCarryover)}
          >
            {endReason === 'day-ended' ? 'End Day' : 'End Table'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
