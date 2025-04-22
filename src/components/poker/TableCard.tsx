
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

interface TableCardProps {
  table: TableData;
  onEndTable: (tableId: string, cashOut: number, notes?: string, bounty?: { bountyCount?: number, bountyAmount?: number }) => void;
  onAddRebuy: (tableId: string, amount: number) => void;
}

const TableCard: React.FC<TableCardProps> = ({ table, onEndTable, onAddRebuy }) => {
  const [showEndTableDialog, setShowEndTableDialog] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [tableNotes, setTableNotes] = useState(table.notes || '');
  const [showRebuyDialog, setShowRebuyDialog] = useState(false);
  const [bountyCount, setBountyCount] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');

  const initialRebuyAmount = table.format === 'Tournament' 
    ? (table.tournamentBuyIn || table.initialBuyIn || table.buyIn).toString()
    : '';
  
  const [rebuyDialogAmount, setRebuyDialogAmount] = useState(initialRebuyAmount);

  const formattedStartTime = dateFormat(new Date(table.startTime), 'h:mm a');
  const formattedDate = dateFormat(new Date(table.startTime), 'MMM d, yyyy');

  const rebuyAmount = (table.buyIn - (table.initialBuyIn || 0)) > 0 ? table.buyIn - (table.initialBuyIn || 0) : 0;

  const isBountyTournament = table.format === 'Tournament' && 
    table.tournamentTypes?.some(type => 
      ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
    );

  const handleEndTable = () => {
    onEndTable(
      table.id, 
      parseFloat(cashOutAmount), 
      tableNotes,
      isBountyTournament ? {
        bountyCount: bountyCount ? parseInt(bountyCount) : undefined,
        bountyAmount: bountyAmount ? parseFloat(bountyAmount) : undefined,
      } : undefined
    );
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
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg">{table.location}</h3>
            <p className="text-sm text-gray-600">
              {table.gameType} • {table.format}
            </p>
            {table.format === 'Tournament' && table.tournamentTypes?.[0] && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-poker-gold/10 text-poker-gold text-xs rounded-full">
                {table.tournamentTypes[0]}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 text-right">
            <p>{formattedStartTime}</p>
            <p>{formattedDate}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Buy-in:</span>
            <span className="font-medium">
              ${table.initialBuyIn?.toFixed(2) ?? table.buyIn.toFixed(2)}
              {(() => {
                const rebuyTotal = (table.buyIn - (table.initialBuyIn ?? table.buyIn));
                const addOnTotal = table.addOns ? table.addOns : 0;
                const extra = rebuyTotal + addOnTotal;
                return extra > 0 ? (
                  <span className="text-gray-500"> (+${extra.toFixed(2)})</span>
                ) : null;
              })()}
            </span>
          </div>
          
          {table.format === 'Tournament' && table.startingBB && (
            <div className="flex justify-between">
              <span className="text-gray-600">Starting BBs:</span>
              <span className="font-medium">{table.startingBB}BB</span>
            </div>
          )}
          
          {table.format === 'Cash' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Blinds:</span>
              <span className="font-medium">${table.smallBlind}/{table.bigBlind}</span>
            </div>
          )}
        </div>

        {table.isActive ? (
          <div className="mt-4 flex gap-2 justify-between">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={openRebuyDialog}
            >
              <Icon name="Plus" className="mr-1 h-4 w-4" /> Rebuy
            </Button>
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
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cash Out:</span>
              <span className="font-semibold text-lg text-poker-gold">
                ${(table.cashOut ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {dateFormat(new Date(table.startTime), 'MMM d, h:mm a')}
              {table.endTime && (
                <>
                  {` - ${dateFormat(new Date(table.endTime), 'h:mm a')}`}
                  <div className="mt-1">
                    Duration: {differenceInMinutes(new Date(table.endTime), new Date(table.startTime))}m
                  </div>
                </>
              )}
            </div>
            {table.format === 'Tournament' && (
              <div className="space-y-1 mt-2 text-sm">
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
