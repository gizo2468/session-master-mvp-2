
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableData, HandData } from '@/types/poker';
import { format } from 'date-fns';
import { ArrowUp, ArrowDown } from 'lucide-react';
import HandsList from './HandsList';

interface TableDetailsCardProps {
  table: TableData;
  hands?: HandData[];
}

export const TableDetailsCard: React.FC<TableDetailsCardProps> = ({ table, hands }) => {
  // Profit/loss calculation
  const profit = (table.cashOut ?? 0) - (table.buyIn ?? 0);
  const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
  const formattedStart = format(new Date(table.startTime), 'MMM d, h:mm a');
  const formattedEnd = table.endTime ? format(new Date(table.endTime), 'MMM d, h:mm a') : null;

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span>{table.name || table.location}</span>
          <span className="text-sm text-gray-500 font-normal">
            {table.gameType} &middot; {table.format}
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
            <div>${table.buyIn.toFixed(2)}</div>
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
          {table.addOns !== undefined && table.addOns > 0 && (
            <div>
              <span className="text-gray-500">Add-ons:</span>
              <div>{table.addOns}</div>
            </div>
          )}
          {table.tournamentBuyIn !== undefined && table.format === 'Tournament' && (
            <div>
              <span className="text-gray-500">Tournament Buy-in:</span>
              <div>${table.tournamentBuyIn.toFixed(2)}</div>
            </div>
          )}
          {table.finalPosition !== undefined && table.format === 'Tournament' && (
            <div>
              <span className="text-gray-500">Final Position:</span>
              <div>{table.finalPosition}</div>
            </div>
          )}
          {table.cashOut !== undefined && (
            <div>
              <span className="text-gray-500">Cash Out:</span>
              <div>${table.cashOut.toFixed(2)}</div>
            </div>
          )}
          <div>
            <span className="text-gray-500">Profit/Loss:</span>
            <div className={`font-bold inline-flex items-center gap-1 ${profitClass}`}>
              {profit >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
            </div>
          </div>
        </div>
        {table.notes && (
          <div className="mb-3">
            <span className="text-gray-500 block mb-1">Notes:</span>
            <div className="text-xs bg-gray-50 p-2 rounded">{table.notes}</div>
          </div>
        )}
        {/* Hands played in this table */}
        {Array.isArray(hands) && hands.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-sm">Hands Played</h4>
            <HandsList hands={hands} onEditHand={() => {}} onDeleteHand={() => {}} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableDetailsCard;
