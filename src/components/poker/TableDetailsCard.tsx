
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { TableData } from '@/types/poker';
import { Clock } from 'lucide-react';
import ProfitLossBadge from './ProfitLossBadge';

interface TableDetailsCardProps {
  table: TableData;
}

const TableDetailsCard: React.FC<TableDetailsCardProps> = ({ table }) => {
  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!endTime) return null;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const duration = formatDuration(table.startTime, table.endTime);
  
  // Updated profit calculation to include bounty amount
  const profit = ((table.cashOut || 0) + (table.bountyAmount || 0)) - table.buyIn;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Header with badges */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">{table.gameType}</Badge>
            <Badge variant={table.format === 'Cash' ? 'default' : 'destructive'}>
              {table.format}
            </Badge>
            {table.isOnline && (
              <Badge variant="outline">Online</Badge>
            )}
            {table.tournamentTypes && table.tournamentTypes.length > 0 && (
              <Badge variant="outline">{table.tournamentTypes[0]}</Badge>
            )}
          </div>

          {/* Time and duration info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Start:</span>
              <div className="font-medium">
                {format(new Date(table.startTime), 'MMM d, h:mm a')}
              </div>
            </div>
            {table.endTime && (
              <div>
                <span className="text-gray-500">Duration:</span>
                <div className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {duration}
                </div>
              </div>
            )}
          </div>

          {/* Financial details */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Initial Buy-in:</span>
                <div className="font-medium">${(table.initialBuyIn || table.buyIn).toFixed(2)}</div>
              </div>
              {table.rebuys && table.rebuys > 0 && (
                <div>
                  <span className="text-gray-500">Rebuys:</span>
                  <div className="font-medium">${((table.buyIn - (table.initialBuyIn || table.buyIn))).toFixed(2)}</div>
                </div>
              )}
            </div>

            {/* Tournament specific fields */}
            {table.format === 'Tournament' && (
              <>
                {/* Regular Payout */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Regular Payout:</span>
                    <div className="font-medium">${(table.cashOut || 0).toFixed(2)}</div>
                  </div>
                  {table.bountyAmount && table.bountyAmount > 0 && (
                    <div>
                      <span className="text-gray-500">Bounty Payout:</span>
                      <div className="font-medium">${table.bountyAmount.toFixed(2)}</div>
                    </div>
                  )}
                </div>

                {/* Total Payout */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Payout:</span>
                    <div className="font-medium">${((table.cashOut || 0) + (table.bountyAmount || 0)).toFixed(2)}</div>
                  </div>
                  {table.finalPosition && (
                    <div>
                      <span className="text-gray-500">Final Position:</span>
                      <div className="font-medium">{table.finalPosition}</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Cash game payout */}
            {table.format === 'Cash' && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Cash Out:</span>
                  <div className="font-medium">${(table.cashOut || 0).toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Blinds:</span>
                  <div className="font-medium">${table.smallBlind}/${table.bigBlind}</div>
                </div>
              </div>
            )}

            {/* Profit/Loss Section */}
            <div className="flex flex-col items-center py-2">
              <span className="text-gray-500 text-sm mb-2">Profit/Loss</span>
              <ProfitLossBadge profit={profit} size="md" />
            </div>
          </div>

          {/* Notes */}
          {table.notes && (
            <div className="pt-3 border-t">
              <span className="text-gray-500 text-sm">Notes:</span>
              <p className="text-sm mt-1">{table.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TableDetailsCard;
