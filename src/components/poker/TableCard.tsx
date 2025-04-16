
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Clock, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PokerTable } from '@/types/poker';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TableCardProps {
  table: PokerTable;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEditTable?: () => void;
  onDeleteTable?: () => void;
  onEndTable: () => void;
  onAddHand: () => void;
}

const TableCard: React.FC<TableCardProps> = ({
  table,
  isExpanded,
  onToggleExpand,
  onEditTable,
  onDeleteTable,
  onEndTable,
  onAddHand
}) => {
  // Calculate profit/loss
  const isCompleted = !table.isActive && table.cashOut !== undefined;
  let profit = 0;
  let profitClass = '';
  
  if (isCompleted && table.cashOut !== undefined) {
    profit = table.cashOut - table.buyIn;
    profitClass = profit >= 0 ? 'text-green-500' : 'text-red-500';
  }
  
  // Calculate rebuys
  const additionalBuyins = table.buyIn - table.initialBuyIn;
  
  // Format time ago
  const timeAgo = formatDistanceToNow(table.startTime, { addSuffix: true });
  
  return (
    <Card className={cn(
      "mb-4 overflow-hidden transition-all duration-200",
      isExpanded ? "border-poker-gold" : "border-gray-200"
    )}>
      <div 
        className={cn(
          "flex justify-between items-center px-4 py-3 cursor-pointer",
          isExpanded ? "bg-poker-gold/10" : "bg-white"
        )}
        onClick={onToggleExpand}
      >
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="font-medium">{table.name}</span>
            <Badge 
              variant={table.isActive ? "outline" : "secondary"} 
              className={cn(
                "ml-2 text-xs",
                table.isActive ? "border-green-500 text-green-600 bg-green-50" : "bg-gray-100"
              )}
            >
              {table.isActive ? "ACTIVE" : "ENDED"}
            </Badge>
          </div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <Clock size={14} className="mr-1" />
            {timeAgo}
          </div>
        </div>
        
        <div className="flex items-center">
          {isCompleted ? (
            <span className={`font-bold text-lg ${profitClass} mr-3`}>
              {profit > 0 ? '+' : ''}{profit.toFixed(2)}
            </span>
          ) : (
            <span className="text-sm text-gray-500 mr-3">
              {table.format} • {table.smallBlind}/{table.bigBlind}
            </span>
          )}
          <div className="rounded-full bg-gray-100 p-1">
            {isExpanded ? 
              <ChevronUp className="h-5 w-5 text-gray-600" /> : 
              <ChevronDown className="h-5 w-5 text-gray-600" />
            }
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <CardContent className="p-4 pt-2">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Game Type</span>
                <p className="font-medium">
                  {table.gameType === 'NLH' ? 'No Limit Hold\'em' : 'Pot Limit Omaha'}
                </p>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Format</span>
                <p className="font-medium">{table.format}</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Buy-in</span>
                <p className="font-medium">
                  ${table.initialBuyIn.toFixed(2)}
                  {additionalBuyins > 0 && <span className="text-gray-500 ml-1">(+${additionalBuyins.toFixed(2)})</span>}
                </p>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Blinds</span>
                <p className="font-medium">${table.smallBlind}/${table.bigBlind}</p>
              </div>
              
              {isCompleted && (
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Cash Out</span>
                  <p className="font-medium">${table.cashOut?.toFixed(2)}</p>
                </div>
              )}
              
              {isCompleted && (
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Profit/Loss</span>
                  <p className={`font-medium ${profitClass}`}>
                    {profit > 0 ? '+' : ''}{profit.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            
            {table.notes && (
              <div className="pt-2">
                <span className="text-xs text-gray-500 block mb-1">Notes</span>
                <p className="text-sm bg-gray-50 p-3 rounded">{table.notes}</p>
              </div>
            )}
            
            <div className="pt-2 flex flex-wrap gap-2">
              {table.isActive && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onAddHand}
                    className="flex-grow"
                  >
                    Add Hand
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onEndTable}
                    className="flex-grow border-amber-500 text-amber-600 hover:bg-amber-50"
                  >
                    End Table
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditTable) onEditTable();
                }}
                className="flex-grow"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteTable) onDeleteTable();
                }}
                className="flex-grow border-red-200 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default TableCard;
