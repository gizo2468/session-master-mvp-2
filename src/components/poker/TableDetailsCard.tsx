
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableData } from '@/types/poker';
import { format } from 'date-fns';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface TableDetailsCardProps {
  table: TableData;
}

export const TableDetailsCard: React.FC<TableDetailsCardProps> = ({ table }) => {
  // Profit/loss calculation
  const profit = (table.cashOut ?? 0) - (table.buyIn ?? 0);
  const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
  const formattedStart = format(new Date(table.startTime), 'MMM d, h:mm a');
  const formattedEnd = table.endTime ? format(new Date(table.endTime), 'MMM d, h:mm a') : null;
  
  // Calculate rebuy amount
  const rebuyAmount = table.buyIn - table.initialBuyIn;

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div>
            <span>{table.name || table.location}</span>
            <span className="text-sm text-gray-500 font-normal ml-2">
              {table.gameType} • {table.format}
            </span>
          </div>
          <span className={`${profitClass} font-bold text-right`}>
            {profit >= 0 ? (
              <ArrowUp className="w-4 h-4 inline mr-1" />
            ) : (
              <ArrowDown className="w-4 h-4 inline mr-1" />
            )}
            ${Math.abs(profit).toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Start:</span>
            <div>{formattedStart}</div>
          </div>
          {formattedEnd && (
            <div>
              <span className="text-gray-500">End:</span>
              <div>{formattedEnd}</div>
            </div>
          )}
          <div>
            <span className="text-gray-500">Buy-in:</span>
            <div>
              ${table.initialBuyIn.toFixed(2)}
              {rebuyAmount > 0 && (
                <span className="text-gray-600 ml-1">
                  (+${rebuyAmount.toFixed(2)})
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Blinds:</span>
            <div>${table.smallBlind}/{table.bigBlind}</div>
          </div>
          {table.rebuys !== undefined && table.rebuys > 0 && (
            <div>
              <span className="text-gray-500">Rebuys:</span>
              <div>{table.rebuys}</div>
            </div>
          )}
          {table.cashOut !== undefined && (
            <div>
              <span className="text-gray-500">Cash Out:</span>
              <div>${table.cashOut.toFixed(2)}</div>
            </div>
          )}
        </div>
        {table.notes && (
          <div className="mt-2">
            <span className="text-gray-500 block mb-1">Notes:</span>
            <div className="text-xs bg-gray-50 p-2 rounded">{table.notes}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableDetailsCard;
