
import React, { useState } from 'react';
import { format } from 'date-fns';
import { TableData } from '@/types/poker';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TableTimerDisplay from './TableTimerDisplay';
import Icon from '@/components/ui/Lucide';
import HandManagementPanel from './HandManagementPanel';

interface TableCardProps {
  table: TableData;
  sessionId: string;
  onEndTable?: (
    tableId: string, 
    cashOut: number, 
    notes?: string,
    bounty?: { 
      bountyCount?: number, 
      bountyAmount?: number, 
      finalPosition?: number 
    },
    multiDayInfo?: {
      nextDayStart?: Date,
      chipsCarryover?: number,
      dayEndedWithoutElimination?: boolean
    }
  ) => void;
  onAddRebuy?: (tableId: string, amount: number) => void;
}

const TableCard: React.FC<TableCardProps> = ({ 
  table, 
  sessionId,
  onEndTable,
  onAddRebuy
}) => {
  const [showRebuyInput, setShowRebuyInput] = useState(false);
  const [rebuyAmount, setRebuyAmount] = useState<number | ''>('');
  const { toast } = useToast();
  
  const handleShowRebuy = () => {
    setShowRebuyInput(true);
  };
  
  const handleCancelRebuy = () => {
    setShowRebuyInput(false);
    setRebuyAmount('');
  };
  
  const handleAddRebuy = () => {
    if (rebuyAmount === '' || isNaN(Number(rebuyAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid rebuy amount.",
        variant: "destructive"
      });
      return;
    }
    
    if (onAddRebuy && table.id) {
      onAddRebuy(table.id, Number(rebuyAmount));
      setShowRebuyInput(false);
      setRebuyAmount('');
    }
  };
  
  // Make "Rebuy" button less prominent for tournaments
  const isTournament = table.format === 'Tournament';

  // Helper function to check if a table is a bounty tournament
  const isBountyTournament = () => {
    return table.format === 'Tournament' && 
      table.tournamentTypes?.some(type => 
        ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
      );
  };
  
  return (
    <div className={`rounded-lg border ${table.isActive ? 'border-poker-feltGreen/40 bg-poker-feltGreen/5' : 'border-gray-200 bg-gray-50'} overflow-hidden`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-lg">{table.name || 'Table'}</h4>
            <p className="text-sm text-gray-600">{table.location}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge variant="outline">{table.gameType}</Badge>
              <Badge variant="outline">{table.format}</Badge>
              {table.isMultiDay && (
                <Badge className="bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200">
                  Multi-Day
                </Badge>
              )}
              {table.tournamentTypes && table.tournamentTypes.map(type => (
                <Badge key={type} className="bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
          
          {table.isActive ? (
            <TableTimerDisplay 
              startTime={table.startTime}
              isActive={table.isActive}
              className="text-poker-feltGreen"
            />
          ) : (
            <div className="text-right">
              <span className={`font-bold ${
                (table.cashOut ?? 0) >= table.buyIn ? 'text-green-600' : 'text-red-600'
              }`}>
                {!table.dayEndedWithoutElimination && (
                  <>
                    {(table.cashOut ?? 0) >= table.buyIn ? '+' : ''}
                    ${((table.cashOut ?? 0) - table.buyIn).toFixed(2)}
                  </>
                )}
                {table.dayEndedWithoutElimination && (
                  <span className="text-poker-feltGreen text-base">Continuing</span>
                )}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between gap-3 text-sm">
          <div>
            <span className="text-gray-500">Buy-in: </span>
            <span className="font-medium">${table.buyIn.toFixed(2)}</span>
          </div>
          
          {table.smallBlind !== undefined && table.bigBlind !== undefined && (
            <div>
              <span className="text-gray-500">Blinds: </span>
              <span className="font-medium">
                ${table.smallBlind}/{table.bigBlind}
              </span>
            </div>
          )}
          
          {table.startingBB !== undefined && table.startingBB > 0 && (
            <div>
              <span className="text-gray-500">BBs: </span>
              <span className="font-medium">{table.startingBB}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Active table controls */}
      {table.isActive && (
        <div className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between">
          <div className="flex gap-2">
            <Button 
              onClick={() => onEndTable && table.id && onEndTable(table.id, 0)}
              variant="destructive"
              size="sm"
            >
              <Icon name="flag" size={14} className="mr-1" />
              End Table
            </Button>
            
            {!showRebuyInput ? (
              <Button 
                onClick={handleShowRebuy} 
                variant={isTournament ? "outline" : "default"}
                size="sm"
                className={isTournament ? "" : "bg-poker-gold hover:bg-poker-darkGold"}
              >
                <Icon name="plus-circle" size={14} className="mr-1" />
                {isTournament ? "Add-on / Rebuy" : "Rebuy"}
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rebuyAmount}
                    onChange={(e) => setRebuyAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="pl-5 pr-2 py-1 w-24 border border-gray-300 rounded text-sm"
                  />
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={handleCancelRebuy}
                >
                  <Icon name="x" size={14} />
                </Button>
                <Button 
                  size="sm" 
                  variant="default"
                  className="h-7 bg-poker-gold hover:bg-poker-darkGold"
                  onClick={handleAddRebuy}
                >
                  <Icon name="check" size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Display hands for both active and inactive tables */}
      <div className="border-t border-gray-200 p-4">
        <HandManagementPanel
          sessionId={sessionId}
          tableId={table.id}
          hands={table.hands || []}
          tableFormat={table.format}
          readOnly={!table.isActive} // Set readOnly based on table status
        />
      </div>
    </div>
  );
};

export default TableCard;
