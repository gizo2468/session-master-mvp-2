
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TableData } from '@/types/poker';

interface TableDetailsCardProps {
  table: TableData;
}

const TableDetailsCard: React.FC<TableDetailsCardProps> = ({ table }) => {
  const profit = table.cashOut !== undefined ? table.cashOut - table.buyIn : 0;
  const isProfitable = profit >= 0;

  return (
    <Card className="bg-white rounded-lg shadow-md mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold">{table.name || table.location}</h3>
            <p className="text-sm text-gray-600">{table.gameType} • {table.format}</p>
          </div>
          {table.cashOut !== undefined && (
            <div className={`text-lg font-bold ${
              isProfitable ? 'text-green-600' : 'text-red-600'
            }`}>
              {isProfitable ? '+' : ''}${profit.toFixed(2)}
            </div>
          )}
        </div>

        <div className="space-y-2 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Buy-In:</span>
            <span className="font-medium">
              <span className="text-poker-gold font-bold">${table.initialBuyIn.toFixed(2)}</span>
              {table.buyIn > table.initialBuyIn && (
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  (+${(table.buyIn - table.initialBuyIn).toFixed(2)} from {table.rebuys || 0} rebuy{table.rebuys !== 1 ? 's' : ''})
                </span>
              )}
            </span>
          </div>

          {table.format === 'Cash' && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Blinds:</span>
              <span className="font-medium">${table.smallBlind}/{table.bigBlind}</span>
            </div>
          )}

          {table.format === 'Tournament' && table.startingBB && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Starting BBs:</span>
              <span className="font-medium">{table.startingBB}</span>
            </div>
          )}

          {table.cashOut !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Cash Out:</span>
              <span className="font-medium text-poker-gold">${table.cashOut.toFixed(2)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TableDetailsCard;
