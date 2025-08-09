
import React, { useState } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { calculateOverallResults, calculateSessionProfit } from '@/utils/sessionCalculations';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';

export default function StatsQuickView({ showExtendedMetrics = false }: { showExtendedMetrics?: boolean }) {
  const { sessions, isLoading } = useSessionContext();
  const [showCurrencyBreakdown, setShowCurrencyBreakdown] = useState(false);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          {showExtendedMetrics && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Calculate stats from database sessions
  const completedSessions = sessions.filter(s => !s.isActive && (s.currentStatus === 'ended' || s.status === 'completed' || !s.status));
  const totalSessions = completedSessions.length;
  
  // Calculate wins and losses using the same logic as Overall Results
  const wins = completedSessions.filter(s => calculateSessionProfit(s) > 0).length;
  const losses = completedSessions.filter(s => calculateSessionProfit(s) <= 0).length;
  
  // Group sessions by currency and calculate results for each
  const resultsByCurrency = completedSessions.reduce((acc, session) => {
    const currency = session.currency || 'USD';
    const profit = calculateSessionProfit(session);
    
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += profit;
    
    return acc;
  }, {} as Record<string, number>);

  // Get USD total for main display
  const usdTotal = resultsByCurrency['USD'] || 0;

  // FIXED: Calculate ITM% per table instead of per session
  let totalTournamentTables = 0;
  let itmTables = 0;
  
  completedSessions.forEach(session => {
    if (session.tables && session.tables.length > 0) {
      // Count tournament tables only
      const tournamentTables = session.tables.filter(table => 
        table.format === 'Tournament' && !table.isActive
      );
      
      totalTournamentTables += tournamentTables.length;
      
      // Count tables that cashed (cashOut > 0)
      const cashedTables = tournamentTables.filter(table => 
        table.cashOut !== undefined && table.cashOut > 0
      );
      
      itmTables += cashedTables.length;
    } else if (session.format === 'Tournament' || session.format === 'Live Tournament' || session.format === 'Online Tournament') {
      // Handle sessions without separate tables (legacy format)
      totalTournamentTables += 1;
      if (session.cashOut !== undefined && session.cashOut > 0) {
        itmTables += 1;
      }
    }
  });
  
  const itmPercentage = totalTournamentTables > 0 ? (itmTables / totalTournamentTables) * 100 : 0;
  
  // Calculate total hands entered across all sessions
  const totalHands = completedSessions.reduce((total, session) => {
    let sessionHands = (session.hands?.length || 0);
    
    // Add hands from tables
    if (session.tables) {
      sessionHands += session.tables.reduce((tableTotal, table) => {
        return tableTotal + (table.hands?.length || 0);
      }, 0);
    }
    
    return total + sessionHands;
  }, 0);
  
  // Calculate average session duration
  const sessionsWithDuration = completedSessions.filter(s => 
    s.startTime && s.endTime && s.endTime > s.startTime
  );
  
  const averageDuration = sessionsWithDuration.length > 0 
    ? sessionsWithDuration.reduce((total, session) => {
        const duration = session.endTime!.getTime() - session.startTime.getTime();
        return total + duration;
      }, 0) / sessionsWithDuration.length
    : 0;
    
  // Convert average duration from milliseconds to hours
  const averageHours = averageDuration / (1000 * 60 * 60);
  
  // Helper function to format currency without unnecessary decimal places and with commas
  const formatCurrency = (amount: number): string => {
    return amount % 1 === 0 ? amount.toLocaleString() : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-2xl font-extrabold tracking-tight mb-4 text-center text-primary">Sessions Stats</h2>
      
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div className="flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm mb-1">Sessions</span>
          <span className="text-lg font-bold">{totalSessions}</span>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm mb-1">Record</span>
          <span className="text-lg font-bold">{wins}W - {losses}L</span>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm mb-1">Overall Results</span>
          <div 
            className="cursor-pointer"
            onClick={() => setShowCurrencyBreakdown(true)}
            title="Click to view currency breakdown"
          >
            {Object.keys(resultsByCurrency).length === 0 ? (
              <span className="text-lg font-bold text-gray-400">$0.00</span>
            ) : (
              <span className={`text-xl font-bold ${usdTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${usdTotal >= 0 ? formatCurrency(usdTotal) : `-${formatCurrency(Math.abs(usdTotal))}`}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div className="flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm mb-1">ITM %</span>
          <span className="text-lg font-bold">{itmPercentage.toFixed(1)}%</span>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm mb-1">Total Hands</span>
          <span className="text-lg font-bold">{totalHands}</span>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm mb-1">Avg Duration</span>
          <span className="text-lg font-bold">{averageHours.toFixed(1)}h</span>
        </div>
      </div>
      
      {showExtendedMetrics && (
        <>
          {/* Additional metrics - first row */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm mb-1">Best Session</span>
              <span className="text-lg font-bold">—</span>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm mb-1">Avg Buy-in</span>
              <span className="text-lg font-bold">$0</span>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm mb-1">ROI %</span>
              <span className="text-lg font-bold">0%</span>
            </div>
          </div>
          
          {/* Additional metrics - second row */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm mb-1">Total Tables</span>
              <span className="text-lg font-bold">0</span>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm mb-1">Cash Game Profit</span>
              <span className="text-lg font-bold">$0</span>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm mb-1">Tournament Profit</span>
              <span className="text-lg font-bold">$0</span>
            </div>
          </div>
        </>
      )}
      
      {/* Currency Breakdown Dialog */}
      <Dialog open={showCurrencyBreakdown} onOpenChange={setShowCurrencyBreakdown}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Currency Breakdown</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {Object.keys(resultsByCurrency).length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No sessions with results found
              </div>
            ) : (
              Object.entries(resultsByCurrency)
                .sort(([currencyA], [currencyB]) => {
                  if (currencyA === 'USD') return -1;
                  if (currencyB === 'USD') return 1;
                  return 0;
                })
                .map(([currency, amount]) => {
                  const symbol = getCurrencySymbol(currency);
                  const resultsClass = amount >= 0 ? 'text-green-600' : 'text-red-600';
                  const currencyName = currency === 'USD' ? 'USD' : 
                                     currency === 'ILS' ? 'ILS' : 
                                     currency === 'EUR' ? 'EUR' : currency;
                  const flag = currency === 'USD' ? '💵' : 
                              currency === 'ILS' ? '₪' : 
                              currency === 'EUR' ? '€' : '💰';
                  
                  return (
                    <div key={currency} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{flag}</span>
                        <span className="font-medium text-gray-700">{currencyName}</span>
                      </div>
                      <div className={`text-lg font-bold ${resultsClass}`}>
                        {amount >= 0 ? '+' : '-'}{symbol} {formatCurrency(Math.abs(amount))}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
