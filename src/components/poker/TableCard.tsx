import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableData } from '@/types/poker';
import { format as dateFormat, differenceInMinutes } from 'date-fns';
import Icon from '@/components/ui/Lucide';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TableTimerDisplay from './TableTimerDisplay';
import { Badge } from '@/components/ui/badge';

interface TableCardProps {
  table: TableData;
  onEndTable: (tableId: string, cashOut: number, notes?: string, bounty?: { bountyCount?: number, bountyAmount?: number, finalPosition?: number }, multiDayInfo?: { nextDayStart?: Date, chipsCarryover?: number, dayEndedWithoutElimination?: boolean }) => void;
  onAddRebuy: (tableId: string, amount: number) => void;
}

const TableCard: React.FC<TableCardProps> = ({ table, onEndTable, onAddRebuy }) => {
  const [showEndTableDialog, setShowEndTableDialog] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [tableNotes, setTableNotes] = useState(table.notes || '');
  const [showRebuyDialog, setShowRebuyDialog] = useState(false);
  const [bountyCount, setBountyCount] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [finalPosition, setFinalPosition] = useState('');
  const [endReason, setEndReason] = useState<'eliminated' | 'day-ended' | null>(null);
  const [nextDayStart, setNextDayStart] = useState<Date | null>(null);
  const [chipsCarryover, setChipsCarryover] = useState('');

  const initialRebuyAmount = table.format === 'Tournament' 
    ? (table.tournamentBuyIn || table.initialBuyIn || table.buyIn).toString()
    : '';
  
  const [rebuyDialogAmount, setRebuyDialogAmount] = useState(initialRebuyAmount);

  const formattedStartTime = dateFormat(new Date(table.startTime), 'h:mm a');
  const formattedDate = dateFormat(new Date(table.startTime), 'MMM d, yyyy');

  const rebuyAmount = (table.buyIn - (table.initialBuyIn || 0)) > 0 ? table.buyIn - (table.initialBuyIn || 0) : 0;
  const rebuyCount = Math.floor(rebuyAmount / (table.initialBuyIn || table.buyIn || 1));

  // Fixed isBountyTournament check to properly identify all bounty tournament types
  const isBountyTournament = table.format === 'Tournament' && 
    table.tournamentTypes?.some(type => 
      ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
    );
    
  const isFreezeout = table.format === 'Tournament' && 
    table.tournamentTypes?.some(type => type === 'Freezeout');

  const handleEndTable = () => {
    onEndTable(
      table.id, 
      endReason === 'day-ended' ? 0 : parseFloat(cashOutAmount), 
      tableNotes,
      {
        bountyCount: bountyCount ? parseInt(bountyCount) : undefined,
        bountyAmount: bountyAmount ? parseFloat(bountyAmount) : undefined,
        finalPosition: finalPosition ? parseInt(finalPosition) : undefined
      },
      endReason === 'day-ended' ? {
        nextDayStart: nextDayStart || undefined,
        chipsCarryover: chipsCarryover ? parseInt(chipsCarryover) : undefined,
        dayEndedWithoutElimination: true
      } : undefined
    );
    setShowEndTableDialog(false);
    resetEndTableForm();
  };

  const resetEndTableForm = () => {
    setCashOutAmount('');
    setTableNotes(table.notes || '');
    setBountyCount('');
    setBountyAmount('');
    setFinalPosition('');
    setEndReason(null);
    setNextDayStart(null);
    setChipsCarryover('');
  };

  const handleAddRebuy = () => {
    if (rebuyDialogAmount) {
      onAddRebuy(table.id, parseFloat(rebuyDialogAmount));
      setShowRebuyDialog(false);
    }
  };
  
  const openRebuyDialog = () => {
    if (table.format === 'Tournament') {
      setRebuyDialogAmount((table.tournamentBuyIn || table.initialBuyIn || table.buyIn).toString());
    } else {
      setRebuyDialogAmount('');
    }
    setShowRebuyDialog(true);
  };

  return (
    <>
      <Card className="bg-white p-4 mb-4">
        <div className="text-center mb-2">
          <h3 className="text-xl font-bold">{table.location}</h3>
          <div className="flex items-center justify-center gap-2 text-base text-gray-600">
            <span>{table.gameType}</span>
            <span>•</span> 
            <span>{table.format}</span>
          </div>
          {table.format === 'Tournament' && table.tournamentTypes?.[0] && (
            <span className="inline-block mt-1 px-3 py-1 bg-poker-gold/10 text-poker-gold rounded-full">
              {table.tournamentTypes[0]}
            </span>
          )}
          {table.isMultiDay && (
            <span className="inline-block mt-1 px-3 py-1 bg-poker-feltGreen/10 text-poker-feltGreen rounded-full ml-2">
              Multi-Day
            </span>
          )}
          <div className="text-sm text-gray-500 mt-1">
            {dateFormat(new Date(table.startTime), 'MMM d, yyyy')}
          </div>
        </div>

        <div className="flex justify-center items-center mb-4 text-sm border-b border-gray-100 pb-4">
          <div className="flex flex-1 justify-center items-center">
            <div className="text-center">
              <div className="text-gray-500 font-medium text-xs uppercase mb-1">Start</div>
              <div className="font-medium">{dateFormat(new Date(table.startTime), 'h:mm a')}</div>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center items-center border-x border-gray-100 px-4">
            <div className="text-center">
              <div className="text-gray-500 font-medium text-xs uppercase mb-1">Duration</div>
              <TableTimerDisplay 
                startTime={table.startTime}
                endTime={table.endTime}
                isActive={table.isActive}
                className="flex justify-center"
              />
            </div>
          </div>
          
          {!table.isActive && table.endTime && (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-center">
                <div className="text-gray-500 font-medium text-xs uppercase mb-1">End</div>
                <div className="font-medium">{dateFormat(new Date(table.endTime), 'h:mm a')}</div>
              </div>
            </div>
          )}
        </div>

        {/* Multi-Day Tournament Continuation Info - Adding this section */}
        {table.isMultiDay && table.dayEndedWithoutElimination && (
          <div className="flex justify-center items-center mb-4 text-sm border-b border-gray-100 pb-4 bg-green-50 rounded-md p-2">
            {table.nextDayStart && (
              <div className="flex-1 flex justify-center items-center">
                <div className="text-center">
                  <div className="text-green-600 font-medium text-xs uppercase mb-1">Next Day Starts</div>
                  <div className="font-medium text-green-800">{dateFormat(new Date(table.nextDayStart), 'MMM d, h:mm a')}</div>
                </div>
              </div>
            )}
            
            {table.chipsCarryover && (
              <div className="flex-1 flex justify-center items-center border-l border-gray-100 pl-4">
                <div className="text-center">
                  <div className="text-green-600 font-medium text-xs uppercase mb-1">Chips Carried Over</div>
                  <div className="font-medium text-green-800">{table.chipsCarryover.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-4 mb-4 justify-center">
            <div className="text-right">
              <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">BUY-IN</span>
              <span className="font-bold text-2xl">
                ${table.initialBuyIn?.toFixed(2) ?? table.buyIn.toFixed(2)}
              </span>
            </div>
            {(() => {
              const rebuyTotal = (table.buyIn - (table.initialBuyIn ?? table.buyIn));
              const addOnTotal = table.addOns ? table.addOns : 0;
              const extra = rebuyTotal + addOnTotal;
              const rebuyCount = Math.floor(rebuyTotal / (table.initialBuyIn ?? table.buyIn));
              return extra > 0 ? (
                <div className="text-right">
                  <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">REBUY</span>
                  <div>
                    <span className="font-bold text-2xl text-amber-600">
                      +${extra.toFixed(2)}
                    </span>
                    {rebuyCount > 0 && (
                      <span className="text-sm text-gray-500 ml-1">({rebuyCount})</span>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
          
          {table.format === 'Cash' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Blinds:</span>
              <span className="font-medium">${table.smallBlind}/{table.bigBlind}</span>
            </div>
          )}
        </div>

        {table.isActive ? (
          <div className="mt-4 flex gap-2 justify-between">
            {isFreezeout ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Icon name="Plus" className="mr-1 h-4 w-4" /> Rebuy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rebuys not allowed in Freezeout tournaments</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={openRebuyDialog}
              >
                <Icon name="Plus" className="mr-1 h-4 w-4" /> Rebuy
              </Button>
            )}
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={() => setShowEndTableDialog(true)}
            >
              <Icon name="CircleStop" className="mr-1 h-4 w-4" /> End Table
            </Button>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {table.format === 'Tournament' && (
              <div className="space-y-1 mt-2 text-xs">
                {table.format === 'Tournament' && table.startingBB && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Starting BBs:</span>
                    <span className="font-medium">{table.startingBB}BB</span>
                  </div>
                )}
                {table.tournamentTypes?.[0] && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tournament Type:</span>
                    <span className="font-medium">{table.tournamentTypes[0]}</span>
                  </div>
                )}
                {table.bountyCount > 0 && table.tournamentTypes?.some(type => 
                  ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
                ) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Players Eliminated:</span>
                    <span className="font-medium">{table.bountyCount}</span>
                  </div>
                )}
                {table.bountyAmount > 0 && table.tournamentTypes?.some(type => 
                  ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
                ) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bounty Collected:</span>
                    <span className="font-medium text-poker-gold">${table.bountyAmount.toFixed(2)}</span>
                  </div>
                )}
                {table.finalPosition && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Final Position:</span>
                    <span className="font-medium">{table.finalPosition}th</span>
                  </div>
                )}
                
                {table.dayEndedWithoutElimination && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-poker-feltGreen">Day Ended (Continuing)</span>
                    </div>
                    {table.chipsCarryover && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Chips Carried Over:</span>
                        <span className="font-medium">{table.chipsCarryover.toLocaleString()}</span>
                      </div>
                    )}
                    {table.nextDayStart && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Day Starts:</span>
                        <span className="font-medium">{dateFormat(new Date(table.nextDayStart), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    )}
                  </>
                )}
                
                {table.cashOut !== undefined && !table.dayEndedWithoutElimination && (
                  <div className="flex flex-col items-center justify-center mt-4 mb-2">
                    <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">TOTAL CASH OUT</span>
                    <span className="font-bold text-2xl text-poker-gold">
                      ${(table.cashOut ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {table.format === 'Cash' && table.cashOut !== undefined && (
              <div className="flex flex-col items-center justify-center mt-4 mb-2">
                <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">TOTAL CASH OUT</span>
                <span className="font-bold text-2xl text-poker-gold">
                  ${(table.cashOut ?? 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      <Dialog open={showEndTableDialog} onOpenChange={setShowEndTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Table</DialogTitle>
            <DialogDescription>
              {table.isMultiDay && table.format === 'Tournament'
                ? "Are you ending this multi-day tournament table because you were eliminated or because the day has ended?"
                : "Enter your cash out amount to complete this table."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {table.isMultiDay && table.format === 'Tournament' && !endReason && (
              <div className="flex flex-col gap-4 mb-6">
                <Button
                  variant="outline"
                  className="w-full py-6 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setEndReason('eliminated')}
                >
                  <Icon name="X" className="mr-2 h-5 w-5" /> Eliminated (Cash Out)
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-6 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => setEndReason('day-ended')}
                >
                  <Icon name="Calendar" className="mr-2 h-5 w-5" /> Day Ended (Continuing)
                </Button>
              </div>
            )}
            
            {(!table.isMultiDay || endReason === 'eliminated' || (table.format === 'Cash')) && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="tableCashout" className="block text-sm font-medium mb-1">
                    Cash Out Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      id="tableCashout"
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                      placeholder="0.00"
                      value={cashOutAmount}
                      onChange={(e) => setCashOutAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Tournament-specific fields - always show final position for tournaments */}
                {table.format === 'Tournament' && endReason !== 'day-ended' && (
                  <div>
                    <label htmlFor="finalPosition" className="block text-sm font-medium mb-1">
                      Final Position {isBountyTournament && '(Required)'}
                    </label>
                    <input
                      id="finalPosition"
                      type="number"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                      placeholder="Enter your final position (e.g. 3 for 3rd)"
                      value={finalPosition}
                      onChange={(e) => setFinalPosition(e.target.value)}
                      required={isBountyTournament}
                    />
                  </div>
                )}

                {/* Bounty tournament fields - fixed the condition to always show for bounty tournaments */}
                {isBountyTournament && endReason !== 'day-ended' && (
                  <>
                    <div>
                      <label htmlFor="bountyCount" className="block text-sm font-medium mb-1">
                        Players Eliminated (Optional)
                      </label>
                      <input
                        id="bountyCount"
                        type="number"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                        placeholder="Number of players eliminated"
                        value={bountyCount}
                        onChange={(e) => setBountyCount(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bountyAmount" className="block text-sm font-medium mb-1">
                        Total Bounty Collected (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          id="bountyAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                          placeholder="0.00"
                          value={bountyAmount}
                          onChange={(e) => setBountyAmount(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {endReason !== 'day-ended' && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Profit/Loss:</span>
                      <span className={`text-sm font-bold ${
                        cashOutAmount && parseFloat(cashOutAmount) >= table.buyIn 
                          ? 'text-green-600' 
                          : cashOutAmount 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                      }`}>
                        {cashOutAmount 
                          ? `$${(parseFloat(cashOutAmount) - table.buyIn).toFixed(2)}` 
                          : '$0.00'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      {cashOutAmount && (
                        <div 
                          className={`h-full ${
                            parseFloat(cashOutAmount) >= table.buyIn 
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                          }`}
                          style={{ 
                            width: cashOutAmount 
                              ? `${Math.min(Math.abs((parseFloat(cashOutAmount) - table.buyIn) / table.buyIn * 100), 100)}%` 
                              : '0%' 
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                    value={nextDayStart ? nextDayStart.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setNextDayStart(e.target.value ? new Date(e.target.value) : null)}
                  />
                  <p className="text-xs text-gray-500 mt-1">When does the next day begin?</p>
                </div>
                
                <div>
                  <label htmlFor="chipsCarryover" className="block text-sm font-medium mb-1">
                    Chips Carryover
                  </label>
                  <input
                    id="chipsCarryover"
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                    placeholder="Number of chips"
                    value={chipsCarryover}
                    onChange={(e) => setChipsCarryover(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">How many chips are you carrying over to the next day?</p>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <label htmlFor="tableNotes" className="block text-sm font-medium mb-1">
                Notes (Optional)
              </label>
              <Textarea
                id="tableNotes"
                className="w-full min-h-[100px] border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                placeholder="Add any notes about this table..."
                value={tableNotes}
                onChange={(e) => setTableNotes(e.target.value)}
              />
            </div>
            
            <DialogFooter className="mt-6">
              {endReason !== null && table.isMultiDay && (
                <Button 
                  variant="ghost" 
                  onClick={() => setEndReason(null)}
                  className="mr-auto"
                >
                  Back
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowEndTableDialog(false);
                  resetEndTableForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEndTable}
                disabled={
                  (endReason === 'eliminated' || !table.isMultiDay || table.format === 'Cash') 
                    ? !cashOutAmount || (isBountyTournament && !finalPosition)
                    : endReason === 'day-ended' 
                      ? !chipsCarryover 
                      : !endReason
                }
                className="bg-poker-gold hover:bg-poker-darkGold text-white"
              >
                End Table
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRebuyDialog} onOpenChange={setShowRebuyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Rebuy</DialogTitle>
            <DialogDescription>
              {table.format === 'Tournament' 
                ? 'Add a tournament rebuy.' 
                : 'Enter the amount for your cash game rebuy.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label htmlFor="rebuyAmount" className="block text-sm font-medium mb-1">
                Rebuy Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  id="rebuyAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                  placeholder="0.00"
                  value={rebuyDialogAmount}
                  onChange={(e) => setRebuyDialogAmount(e.target.value)}
                  readOnly={table.format === 'Tournament'}
                />
              </div>
              {table.format === 'Tournament' && (
                <p className="text-xs text-gray-500 mt-1">
                  Tournament rebuy amount is fixed.
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRebuyDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRebuy}
                disabled={!rebuyDialogAmount || parseFloat(rebuyDialogAmount) <= 0}
                className="bg-poker-gold hover:bg-poker-darkGold text-white"
              >
                Add Rebuy
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TableCard;
