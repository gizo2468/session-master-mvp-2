
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PokerSession, TableData } from '@/types/poker';
import { Badge } from "@/components/ui/badge";
import { DollarSign, CircleDollarSign, TrendingUp, TrendingDown, Globe, Calendar, CreditCard, Share2 } from "lucide-react";
import { format } from 'date-fns';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { useSessionSharing } from '@/hooks/useSessionSharing';

interface SessionDetailsCardProps {
  session: PokerSession;
}

const SessionDetailsCard: React.FC<SessionDetailsCardProps> = ({ session }) => {
  const navigate = useNavigate();
  const tables = session.tables || [];
  const currencySymbol = getCurrencySymbol(session.currency);
  
  // Get session sharing status
  const { isShared, sharedCoaches, connectedCoaches } = useSessionSharing(session.id);

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
  
  // Calculate total buy-in (initial + rebuys)
  const totalBuyIn = totalInitialBuyin + totalRebuyAmount;
  
  // Calculate total payouts from all completed tables (regular cashOut only, no bounty)
  let totalPayouts = 0;
  const completedTables = tables.filter(table => !table.isActive && table.cashOut !== undefined);
  completedTables.forEach((table) => {
    // Use only cashOut - do NOT add bountyAmount
    totalPayouts += table.cashOut || 0;
  });
  
  // Calculate total profit/loss from all tables (excluding bounty amounts)
  let totalProfit = 0;
  if (tables.length > 0) {
    tables.forEach((table) => {
      // Only use cashOut for profit calculation, not bounty amount
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

  // Count multi-day tables that are continuing
  const multiDayTables = tables.filter(t => t.isMultiDay && t.dayEndedWithoutElimination);
  const hasMultiDayTables = multiDayTables.length > 0;

  return (
    <Card className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Session Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Only show "Playing From" if it's not an online game */}
          {!session.isOnline && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-muted-foreground">Playing From:</span>
              <span className="font-medium">{session.location}</span>
            </div>
          )}
          
          {/* Show online game information */}
          {session.isOnline && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400 dark:text-gray-500" />
                <span className="text-gray-500 dark:text-muted-foreground">Online Game – Played from:</span>
              </div>
              <span className="font-medium">{session.physicalLocation || "Not specified"}</span>
            </div>
          )}
          
          {/* Game Type */}
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-muted-foreground">Game Type:</span>
            <span className="font-medium">{session.gameType}</span>
          </div>
          
          {/* Session Sharing Status - only show if shared */}
          {isShared && sharedCoaches.length > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-gray-500 dark:text-muted-foreground">Shared With:</span>
              </div>
              <div className="font-medium text-amber-700">
                {sharedCoaches.map((coachId, index) => {
                  const coach = connectedCoaches.find(c => c.id === coachId);
                  if (!coach) return null;
                  return (
                    <span key={coachId}>
                      <span 
                        className="cursor-pointer hover:underline"
                        onClick={() => navigate(`/coach/${coachId}`)}
                      >
                        {coach.displayName}
                      </span>
                      {index < sharedCoaches.length - 1 && ', '}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Center-aligned summary pills */}
          <div className="flex flex-row flex-wrap items-start justify-center gap-2 mt-1 mb-1">
            {/* Total Buy-ins Badge */}
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-amber-400 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-700/60 text-amber-800 px-4 py-1.5 font-normal text-sm w-full mt-2 justify-center"
            >
              <span className="font-bold text-amber-700 dark:text-amber-300 text-base">Total Buy-Ins: {currencySymbol}{totalBuyIn.toFixed(2)}</span>
            </Badge>
            
            {/* Total Payouts Badge - only show if there are completed tables with payouts */}
            {totalPayouts > 0 && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-green-400 bg-green-50 dark:bg-green-950/50 dark:border-green-700/60 text-green-800 px-4 py-1.5 font-normal text-sm w-full justify-center"
              >
                <span className="font-bold text-green-700 dark:text-green-300 text-base">Total Payouts: {currencySymbol}{totalPayouts.toFixed(2)}</span>
              </Badge>
            )}
            
            {/* Multi-day tournament badge */}
            {hasMultiDayTables && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 border-green-300 bg-green-50 text-green-800 px-3 py-1 font-normal text-sm"
              >
                <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="font-bold">{multiDayTables.length}</span>
                <span className="ml-1 opacity-80 text-xs">
                  Continuing multi-day {multiDayTables.length === 1 ? "tournament" : "tournaments"}
                </span>
              </Badge>
            )}
          </div>
          
          {!session.isActive && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-muted-foreground">Profit/Loss:</span>
              <div className="flex items-center gap-1">
                {totalProfit >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`font-bold ${profitClass}`}>
                  {totalProfit >= 0 ? '+' : ''}{currencySymbol}{Math.abs(totalProfit).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          
          
          {/* Multi-day tournaments details section */}
          {hasMultiDayTables && (
            <div className="pt-3 mt-2 border-t border-gray-100 dark:border-border">
              <h4 className="text-sm font-medium text-green-700 mb-2">Continuing Tournaments</h4>
              <div className="space-y-2">
                {multiDayTables.map((table) => (
                  <div key={table.id} className="rounded-md bg-green-50 p-2 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{table.location}</span>
                      {table.chipsCarryover && (
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-green-600" />
                          <span className="text-green-700">{table.chipsCarryover.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {table.nextDayStart && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Next day:</span>
                        <span className="font-medium">{format(new Date(table.nextDayStart), 'd MMM, HH:mm')}</span>
                      </div>
                    )}
                    {table.notes && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1 pt-1 border-t border-green-100">
                        {table.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {session.notes && !hasMultiDayTables && (
            <div className="pt-2">
              <span className="text-gray-500 dark:text-muted-foreground block mb-1">Notes:</span>
              <p className="text-sm bg-gray-50 dark:bg-background p-3 rounded">{session.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionDetailsCard;
