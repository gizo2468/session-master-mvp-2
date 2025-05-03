
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PokerSession } from '@/types/poker';
import { Badge } from "@/components/ui/badge";
import { DollarSign, CircleDollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface SessionDetailsCardProps {
  session: PokerSession;
}

const SessionDetailsCard: React.FC<SessionDetailsCardProps> = ({ session }) => {
  const tables = session.tables || [];

  // Calculate total initial buy-ins and rebuys across all tables
  let totalInitialBuyin = 0, totalRebuyAmount = 0, rebuyCount = 0;
  tables.forEach((t) => {
    totalInitialBuyin += t.initialBuyIn;
    const tableRebuyAmount = t.buyIn - t.initialBuyIn;
    if (tableRebuyAmount > 0) {
      totalRebuyAmount += tableRebuyAmount;
      rebuyCount += t.rebuys || 0;
    }
  });
  
  // If there are no tables, use session's own initial buy-in
  if (tables.length === 0) {
    totalInitialBuyin = session.initialBuyIn;
    totalRebuyAmount = session.buyIn - session.initialBuyIn;
    rebuyCount = session.rebuys || 0;
  }
  
  // Calculate total profit/loss from all tables
  let totalProfit = 0;
  if (tables.length > 0) {
    tables.forEach((table) => {
      totalProfit += (table.cashOut || 0) - table.buyIn;
    });
  } else {
    // If there are no tables, use session's own profit calculation
    totalProfit = (session.cashOut || 0) - session.buyIn;
  }
  
  const tableCount = tables.length;
  const profitClass = totalProfit >= 0 ? "text-green-600" : "text-red-600";

  // IMPORTANT: Only show blinds for Cash format - strict check to ensure it's never shown for Tournament
  const shouldShowBlinds = session.format === 'Cash' && session.smallBlind !== undefined && session.bigBlind !== undefined;

  return (
    <Card className="bg-white rounded-lg shadow-md mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Session Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Playing From:</span>
            <span className="font-medium">{session.location}</span>
          </div>
          <div className="flex flex-row flex-wrap items-start gap-2 mt-1 mb-1">
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-gray-300 bg-gray-100 text-gray-800 px-3 py-1 font-normal text-sm"
            >
              <DollarSign className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="font-bold text-poker-gold">${totalInitialBuyin.toFixed(2)}</span>
              <span className="ml-1 opacity-80 text-xs">
                {tableCount > 0 ? `from ${tableCount} table${tableCount !== 1 ? "s" : ""}` : "buy-in"}
              </span>
            </Badge>
            {totalRebuyAmount > 0 && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-gray-300 bg-gray-100 text-gray-800 px-3 py-1 font-normal text-sm"
              >
                <CircleDollarSign className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="font-bold text-poker-gold">+${totalRebuyAmount.toFixed(2)}</span>
                <span className="ml-1 opacity-80 text-xs">
                  from {rebuyCount} rebuy{rebuyCount !== 1 ? "s" : ""}
                </span>
              </Badge>
            )}
          </div>
          
          {!session.isActive && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Profit/Loss:</span>
              <div className="flex items-center gap-1">
                {totalProfit >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`font-bold ${profitClass}`}>
                  {totalProfit >= 0 ? '+' : ''}${Math.abs(totalProfit).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          
          {/* Only show blinds row if it's STRICTLY a Cash game format AND has valid blinds values */}
          {shouldShowBlinds && (
            <div className="flex justify-between">
              <span className="text-gray-500">Blinds:</span>
              <span className="font-medium">${session.smallBlind}/{session.bigBlind}</span>
            </div>
          )}
          
          {session.notes && (
            <div className="pt-2">
              <span className="text-gray-500 block mb-1">Notes:</span>
              <p className="text-sm bg-gray-50 p-3 rounded">{session.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionDetailsCard;
