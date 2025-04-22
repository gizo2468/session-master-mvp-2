
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableData } from '@/types/poker';
import { format } from 'date-fns';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface TableDetailsCardProps {
  table: TableData;
}

export const TableDetailsCard: React.FC<TableDetailsCardProps> = ({ table }) => {
  const profit = (table.cashOut ?? 0) - (table.buyIn ?? 0);
  const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
  const formattedStart = format(new Date(table.startTime), 'MMM d, h:mm a');
  const formattedEnd = table.endTime ? format(new Date(table.endTime), 'MMM d, h:mm a') : null;
  const rebuyAmount = table.buyIn - table.initialBuyIn;
  const isBountyTournament = table.tournamentTypes?.some(type => 
    ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
  );

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div>
            <span>{table.location}</span>
            <span className="text-sm text-gray-500 font-normal ml-2">
              {table.gameType} • {table.format}
            </span>
          </div>
          <span className={`${profitClass} font-bold text-right text-lg`}>
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
            <span className="text-gray-500">Cash Out:</span>
            <div className="font-bold text-lg text-poker-gold">
              ${(table.cashOut ?? 0).toFixed(2)}
            </div>
          </div>
          {table.format === 'Tournament' && table.startingBB && (
            <div>
              <span className="text-gray-500">Starting BBs:</span>
              <div>{table.startingBB}BB</div>
            </div>
          )}
          {table.tournamentTypes && table.tournamentTypes.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">Tournament Type:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {table.tournamentTypes.map((type) => (
                  <span key={type} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
          {isBountyTournament && table.bountyCount !== undefined && table.bountyCount > 0 && (
            <div>
              <span className="text-gray-500">Players Eliminated:</span>
              <div>{table.bountyCount}</div>
            </div>
          )}
          {isBountyTournament && table.bountyAmount !== undefined && table.bountyAmount > 0 && (
            <div>
              <span className="text-gray-500">Total Bounty Collected:</span>
              <div className="text-poker-gold font-medium">${table.bountyAmount.toFixed(2)}</div>
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
