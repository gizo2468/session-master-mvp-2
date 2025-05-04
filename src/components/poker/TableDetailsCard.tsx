
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableData } from '@/types/poker';
import { format } from 'date-fns';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import TableTimerDisplay from './TableTimerDisplay';

interface TableDetailsCardProps {
  table: TableData;
}

export const TableDetailsCard: React.FC<TableDetailsCardProps> = ({ table }) => {
  const profit = (table.cashOut ?? 0) - (table.buyIn ?? 0);
  const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';
  const formattedStart = format(new Date(table.startTime), 'MMM d, h:mm a');
  const formattedEnd = table.endTime ? format(new Date(table.endTime), 'MMM d, h:mm a') : null;
  const rebuyAmount = (table.buyIn - (table.initialBuyIn || 0)) > 0 ? table.buyIn - (table.initialBuyIn || 0) : 0;
  const isBountyTournament = table.tournamentTypes?.some(type => 
    ['Bounty', 'Progressive Bounty (PKO)', 'Mystery Bounty'].includes(type)
  );
  const isMobile = useIsMobile();

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
        {/* Aligned Start and End Times horizontally with Duration Timer */}
        <div className="flex justify-between items-center mb-4 text-sm">
          <div>
            <span className="text-gray-500">Start:</span>
            <div>{formattedStart}</div>
          </div>
          
          {/* Duration Display between Start and End */}
          {table.startTime && table.endTime && (
            <div className="flex items-center">
              <TableTimerDisplay 
                startTime={new Date(table.startTime)} 
                endTime={new Date(table.endTime)}
                isActive={false}
                className="mx-2"
              />
            </div>
          )}
          
          {formattedEnd && (
            <div>
              <span className="text-gray-500">End:</span>
              <div>{formattedEnd}</div>
            </div>
          )}
        </div>
        
        {/* Styled Buy-in and Rebuy section to match active tables in Live Session */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-right">
            <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">BUY-IN</span>
            <span className="font-bold text-2xl">
              ${table.initialBuyIn?.toFixed(2) ?? table.buyIn.toFixed(2)}
            </span>
          </div>
          {rebuyAmount > 0 && (
            <div className="text-right">
              <span className="block uppercase text-xs text-gray-500 font-medium tracking-wider">REBUY</span>
              <span className="font-bold text-2xl text-amber-600">
                +${rebuyAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        
        {/* Condensed fields into a single row with separators - WITHOUT Total Cash Out */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs mb-4">
          {table.format === 'Tournament' && table.startingBB && (
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Starting BBs:</span>
              <span>{table.startingBB}BB</span>
            </div>
          )}
          
          {table.format === 'Tournament' && table.startingBB && table.tournamentTypes && table.tournamentTypes.length > 0 && (
            <span className="text-gray-400">•</span>
          )}
          
          {table.tournamentTypes && table.tournamentTypes.length > 0 && (
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">Tournament Type:</span>
              <span className="flex flex-wrap gap-1">
                {table.tournamentTypes.map((type, index) => (
                  <React.Fragment key={type}>
                    {index > 0 && <span>,</span>}
                    <span>{type}</span>
                  </React.Fragment>
                ))}
              </span>
            </div>
          )}
        </div>
        
        {/* Additional tournament-specific fields */}
        {isBountyTournament && (table.bountyCount !== undefined || table.bountyAmount !== undefined) && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
            {table.bountyCount !== undefined && table.bountyCount > 0 && (
              <div>
                <span className="text-gray-500">Players Eliminated:</span>
                <div>{table.bountyCount}</div>
              </div>
            )}
            {table.bountyAmount !== undefined && table.bountyAmount > 0 && (
              <div>
                <span className="text-gray-500">Total Bounty Collected:</span>
                <div className="text-poker-gold font-medium">${table.bountyAmount.toFixed(2)}</div>
              </div>
            )}
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
