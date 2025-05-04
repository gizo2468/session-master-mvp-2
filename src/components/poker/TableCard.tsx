
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
  onEndTable: (tableId: string, cashOut: number, notes?: string, bounty?: { bountyCount?: number, bountyAmount?: number, finalPosition?: number }) => void;
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

  const initialRebuyAmount = table.format === 'Tournament' 
    ? (table.tournamentBuyIn || table.initialBuyIn || table.buyIn).toString()
    : '';
  
  const [rebuyDialogAmount, setRebuyDialogAmount] = useState(initialRebuyAmount);

  const formattedStartTime = dateFormat(new Date(table.startTime), 'h:mm a');
  const formattedDate = dateFormat(new Date(table.startTime), 'MMM d, yyyy');

  const rebuyAmount = (table.buyIn - (table.initialBuyIn || 0)) > 0 ? table.buyIn - (table.initialBuyIn || 0) : 0;
  const rebuyCount = Math.floor(rebuyAmount / (table.initialBuyIn || table.buyIn || 1));

  const isBountyTournament = table.format === 'Tournament' && 
    table.tournamentTypes?.some(type => 
      ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
    );
    
  const isFreezeout = table.format === 'Tournament' && 
    table.tournamentTypes?.some(type => type === 'Freezeout');

  const handleEndTable = () => {
    onEndTable(
      table.id, 
      parseFloat(cashOutAmount), 
      tableNotes,
      {
        bountyCount: bountyCount ? parseInt(bountyCount) : undefined,
        bountyAmount: bountyAmount ? parseFloat(bountyAmount) : undefined,
        finalPosition: finalPosition ? parseInt(finalPosition) : undefined
      }
    );
    setShowEndTableDialog(false);
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
        {/* Improved header layout with larger text and more balanced visual design */}
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
          <div className="text-sm text-gray-500 mt-1">
            {dateFormat(new Date(table.startTime), 'MMM d, yyyy')}
          </div>
        </div>

        {/* Redesigned Start, Duration row with better visual balance */}
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

        <div className="space-y-2">
          {/* Styled Buy-in and Rebuy section to match active tables in Live Session with rebuy count */}
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
                    <div className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full opacity-50 cursor-not-allowed"
                        disabled={true}
                      >
                        <Icon name="Plus" className="mr-1 h-4 w-4" /> Rebuy
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rebuys are not allowed in Freezeout tournaments</p>
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
                
                {/* Repositioned Total Cash Out to be more prominent */}
                {table.cashOut !== undefined && (
                  <div className="flex flex-col items-center justify-center mt-4 mb-2">
                    <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">TOTAL CASH OUT</span>
                    <span className="font-bold text-2xl text-poker-gold">
                      ${(table.cashOut ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Display Cash Game closed table cash out */}
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
              Enter your cash out amount to complete this table.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
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

              {table.format === 'Tournament' && (
                <div>
                  <label htmlFor="finalPosition" className="block text-sm font-medium mb-1">
                    Final Position (Optional)
                  </label>
                  <input
                    id="finalPosition"
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-poker-feltGreen focus:border-poker-feltGreen"
                    placeholder="Enter your final position (e.g. 3 for 3rd)"
                    value={finalPosition}
                    onChange={(e) => setFinalPosition(e.target.value)}
                  />
                </div>
              )}

              {isBountyTournament && (
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
              
              <div>
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
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEndTableDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEndTable}
                disabled={!cashOutAmount}
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
