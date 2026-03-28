import React, { useState, useEffect } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { calculateSessionProfit } from '@/utils/sessionCalculations';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { useUnifiedSessionStats } from '@/hooks/useUnifiedSessionStats';
import { calculateSessionStatisticsFromDB } from '@/utils/statisticsCalculator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import CurrencyConversionModal from './CurrencyConversionModal';
import HandHistoryExportModal from './poker/HandHistoryExportModal';
import { ArrowRightLeft } from 'lucide-react';

interface CurrencyConversion {
  id: string;
  from_currency: string;
  to_currency: string;
  original_amount: number;
  converted_amount: number;
  exchange_rate: number;
  created_at: string;
}

function MobileStackTitle({ text }: { text: string }) {
  const isPercentTitle = text.includes('%'); // e.g., "Win %", "ROI %"

  // Keep percentage titles on a single line on mobile; vertically center within two-line slot
  if (isPercentTitle) {
    return (
      <span className="text-gray-500 dark:text-muted-foreground text-sm leading-5 min-h-[2.5rem] sm:min-h-0 flex items-center justify-center sm:inline-flex sm:justify-start sm:items-baseline whitespace-nowrap">
        {text}
      </span>
    );
  }

  const [first, ...restParts] = text.split(' ');
  const rest = restParts.join(' ');

  // Single-word titles: keep one line, vertically centered on mobile
  if (!rest) {
    return (
      <span className="text-gray-500 dark:text-muted-foreground text-sm leading-5 min-h-[2.5rem] sm:min-h-0 flex items-center justify-center sm:inline-flex sm:justify-start sm:items-baseline">
        {first}
      </span>
    );
  }

  // Multi-word titles: stack words on mobile, single-line on tablet/desktop
  return (
    <span className="text-gray-500 dark:text-muted-foreground text-sm leading-5 min-h-[2.5rem] sm:min-h-0 flex sm:inline">
      <span className="flex flex-col justify-center">
        <span>{first}</span>
        <span className="block sm:inline">{' '}{rest}</span>
      </span>
    </span>
  );
}

const StatsQuickView = ({ showExtendedMetrics = false }: { showExtendedMetrics?: boolean }) => {
  const { sessions, isLoading: sessionsLoading } = useSessionContext();
  const { user } = useAuth();
  const [showCurrencyBreakdown, setShowCurrencyBreakdown] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [showHandExport, setShowHandExport] = useState(false);
  // Home screen stats always use USD, independent of ID Card currency
  const homeCurrency = 'USD';
  
  // Fetch unified statistics from database - single source of truth
  const { statistics, isLoading: statsLoading } = useUnifiedSessionStats();
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [currencyBreakdown, setCurrencyBreakdown] = useState<Record<string, number>>({});
  const [overallCurrencyResult, setOverallCurrencyResult] = useState<number>(0);
  const [conversions, setConversions] = useState<CurrencyConversion[]>([]);
  const [conversionsLoading, setConversionsLoading] = useState(false);
  const isLoading = sessionsLoading || statsLoading || breakdownLoading || conversionsLoading;

  // Fetch currency conversions from database
  const fetchConversions = async () => {
    if (!user?.id) return;
    try {
      setConversionsLoading(true);
      const { data, error } = await supabase
        .from('currency_conversions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setConversions((data as CurrencyConversion[]) || []);
    } catch (e) {
      console.error('Failed to fetch conversions:', e);
    } finally {
      setConversionsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversions();
  }, [user?.id]);

  // Keep Overall Results and Currency Breakdown fully in sync with DB totals per currency
  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        setBreakdownLoading(true);
        // Use completed sessions only to discover currencies; values come from DB
        const completed = sessions.filter(s => !s.isActive && (s.currentStatus === 'ended' || s.status === 'completed' || !s.status));
        const currencies = Array.from(new Set(completed.map(s => s.currency || 'USD')));
        if (!currencies.includes(homeCurrency)) {
          currencies.push(homeCurrency);
        }
        const results = await Promise.all(
          currencies.map(async (cur) => {
            const stats = await calculateSessionStatisticsFromDB('all', 'all-time', undefined, undefined, cur);
            return [cur, Number(stats?.netResult || 0)] as [string, number];
          })
        );
        const map: Record<string, number> = {};
        results.forEach(([cur, val]) => { map[cur] = val; });
        setCurrencyBreakdown(map);
        setOverallCurrencyResult(map[homeCurrency] || 0);
      } catch (e) {
        console.error('Failed to fetch currency breakdown from DB', e);
      } finally {
        setBreakdownLoading(false);
      }
    };
    fetchBreakdown();
  }, [sessions, homeCurrency]);

  // Calculate adjusted breakdown based on conversions
  const getAdjustedBreakdown = () => {
    const original = { ...currencyBreakdown };
    const adjusted = { ...currencyBreakdown };

    conversions.forEach((conv) => {
      // Subtract original amount from source currency
      adjusted[conv.from_currency] = (adjusted[conv.from_currency] || 0) - conv.original_amount;
      // Add converted amount to target currency
      adjusted[conv.to_currency] = (adjusted[conv.to_currency] || 0) + conv.converted_amount;
    });

    return { original, adjusted };
  };

  const { original: originalBreakdown, adjusted: adjustedBreakdown } = getAdjustedBreakdown();
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-4 mb-6 min-h-[220px]">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
          </div>
          {showExtendedMetrics && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-muted rounded"></div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Get database-sourced statistics (single source of truth)
  const dbStats = statistics.all;
  
  // Calculate statistics from database
  // Use adjusted total for preferred currency (includes conversions)
  const overallResults = adjustedBreakdown[homeCurrency] ?? overallCurrencyResult;
  const totalSessions = dbStats?.numberOfSessions || 0;
  const winRatio = dbStats?.winRatio || 0;
  const wins = Math.round((winRatio * totalSessions) / 100);
  const losses = totalSessions - wins;
  const totalHands = dbStats?.handsCount || 0;
  const averageHours = dbStats?.averageDuration || 0;
  const totalTables = dbStats?.totalTables || 0;
  const totalBuyIns = dbStats?.totalBuyIns || 0;
  const totalPayouts = dbStats?.totalPayouts || 0;
  
  // Currency breakdown sourced from DB to stay in sync
  const completedSessions = sessions.filter(s => !s.isActive && (s.currentStatus === 'ended' || s.status === 'completed' || !s.status));
  const allResultsByCurrency = currencyBreakdown;

  // Currency display functions
  const currencySymbol = getCurrencySymbol(homeCurrency);
  const formatCurrency = (amount: number): string => {
    return amount % 1 === 0 ? amount.toLocaleString() : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const displayCurrency = (amount: number): string => {
    const abs = Math.abs(amount);
    const formatted = `${currencySymbol}${formatCurrency(abs)}`;
    return amount < 0 ? `-${formatted}` : formatted;
  };

  // Display calculations
  const winDisplay = totalSessions === 0 ? '—' : `${winRatio.toFixed(1)}%`;
  const avgBuyIn = totalSessions > 0 ? totalBuyIns / totalSessions : 0;
  const roiPercent = totalBuyIns > 0 ? (overallResults / totalBuyIns) * 100 : 0;
  
  // Extended metrics - fetch from database for cash/tournament splits
  const cashStats = statistics.cash;
  const tournamentStats = statistics.tournaments;
  const cashGameProfit = cashStats?.netResult || 0;
  const tournamentProfit = tournamentStats?.netResult || 0;
  
  // Best session calculation from in-memory (for display purposes)
  const defaultCurrencySessions = completedSessions.filter(s => (s.currency || 'USD') === homeCurrency);
  const bestSessionProfit = defaultCurrencySessions.length > 0 
    ? defaultCurrencySessions.reduce((max, s) => {
        const p = calculateSessionProfit(s);
        return p > max ? p : max;
      }, -Infinity) 
    : 0;
  const normalizedBest = bestSessionProfit === -Infinity ? 0 : bestSessionProfit;
  
  return (
    <div className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-4 mb-6">
      <h2 className="text-2xl font-extrabold tracking-tight mb-4 text-center text-primary">Sessions Stats</h2>
      
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div className="grid place-items-center gap-1">
          <MobileStackTitle text="Sessions" />
          <span className={showExtendedMetrics ? "text-base font-bold" : "text-xl font-bold"}>{totalSessions}</span>
        </div>
        
        <div className="grid place-items-center gap-1">
          <MobileStackTitle text="Record" />
          <span className={showExtendedMetrics ? "text-base font-bold" : "text-xl font-bold"}>{wins}W - {losses}L</span>
        </div>
        
        <div className="grid place-items-center gap-1">
          <MobileStackTitle text="Overall Results" />
          <div 
            className="cursor-pointer"
            onClick={() => setShowCurrencyBreakdown(true)}
            title="Click to view currency breakdown"
          >
            {Object.keys(allResultsByCurrency).length === 0 ? (
              <span className="text-base font-bold text-gray-400 dark:text-gray-500">{displayCurrency(0)}</span>
            ) : (
              <span className={`text-base font-bold ${overallResults >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {displayCurrency(overallResults)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {!showExtendedMetrics && (
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className="grid place-items-center gap-1">
            <MobileStackTitle text="Win %" />
            <span className="text-xl font-bold">{winDisplay}</span>
          </div>
          
          <div
            className="grid place-items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowHandExport(true)}
            role="button"
            tabIndex={0}
          >
            <MobileStackTitle text="Total Hands" />
            <span className="text-xl font-bold underline decoration-dotted underline-offset-2">{totalHands}</span>
          </div>
          
          <div className="grid place-items-center gap-1">
            <MobileStackTitle text="Avg Duration" />
            <span className="text-xl font-bold">{averageHours.toFixed(1)}h</span>
          </div>
        </div>
      )}
      
      {showExtendedMetrics && (
        <>
          {/* Row 2: Total Tables, ITM %, ROI % */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div className="grid place-items-center gap-1">
              <MobileStackTitle text="Total Tables" />
              <span className="text-base font-bold">{totalTables}</span>
            </div>
            
            <div className="grid place-items-center gap-1">
              <MobileStackTitle text="Win %" />
              <span className="text-base font-bold">{winDisplay}</span>
            </div>
            
            <div className="grid place-items-center gap-1">
              <MobileStackTitle text="ROI %" />
              <span className="text-base font-bold">{roiPercent.toFixed(1)}%</span>
            </div>
          </div>
          
          {/* Row 3: Total Hands, Avg Buy-in, Avg Duration */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div
              className="grid place-items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowHandExport(true)}
              role="button"
              tabIndex={0}
            >
              <MobileStackTitle text="Total Hands" />
              <span className="text-base font-bold underline decoration-dotted underline-offset-2">{totalHands}</span>
            </div>
            
            <div className="grid place-items-center gap-1">
              <MobileStackTitle text="Avg Buy-in" />
              <span className="text-base font-bold">{displayCurrency(Math.round(avgBuyIn))}</span>
            </div>
            
            <div className="grid place-items-center gap-1">
              <MobileStackTitle text="Avg Duration" />
              <span className="text-base font-bold">{averageHours.toFixed(1)}h</span>
            </div>
          </div>
          
          {/* Row 4: Best Session, Cash Profit, Tournament Profit */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="grid place-items-center gap-1">
              <MobileStackTitle text="Best Session" />
              <span className="text-base font-bold">{defaultCurrencySessions.length === 0 ? '—' : displayCurrency(normalizedBest)}</span>
            </div>
            
            <div className="grid place-items-center gap-1">
              <MobileStackTitle text="Cash Profit" />
              <span className="text-base font-bold">{displayCurrency(cashGameProfit)}</span>
            </div>
            
            <div className="grid place-items-center gap-1">
              <MobileStackTitle text="Tournament Profit" />
              <span className="text-base font-bold">{displayCurrency(tournamentProfit)}</span>
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
            {Object.keys(adjustedBreakdown).length === 0 && Object.keys(originalBreakdown).length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No sessions with results found
              </div>
            ) : (
              // Combine all currencies from both original and adjusted
              [...new Set([...Object.keys(originalBreakdown), ...Object.keys(adjustedBreakdown)])]
                .sort((currencyA, currencyB) => {
                  if (currencyA === 'USD') return -1;
                  if (currencyB === 'USD') return 1;
                  return 0;
                })
                .map((currency) => {
                  const symbol = getCurrencySymbol(currency);
                  const originalAmount = originalBreakdown[currency] || 0;
                  const adjustedAmount = adjustedBreakdown[currency] || 0;
                  const hasConversion = originalAmount !== adjustedAmount;
                  const resultsClass = adjustedAmount >= 0 ? 'text-green-600' : 'text-red-600';
                  const currencyName = currency === 'USD' ? 'USD' : 
                                     currency === 'ILS' ? 'ILS' : 
                                     currency === 'EUR' ? 'EUR' : currency;
                  const flag = currency === 'USD' ? '$' : 
                              currency === 'ILS' ? '₪' : 
                              currency === 'EUR' ? '€' : symbol;
                  
                  return (
                    <div key={currency} className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{flag}</span>
                        <span className="font-medium text-foreground">{currencyName}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${resultsClass}`}>
                          {adjustedAmount >= 0 ? '+' : '-'}{symbol} {formatCurrency(Math.abs(adjustedAmount))}
                        </div>
                        {hasConversion && (
                          <div className="text-xs text-muted-foreground">
                            ({originalAmount >= 0 ? '+' : '-'}{symbol}{formatCurrency(Math.abs(originalAmount))})
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCurrencyBreakdown(false);
                setShowConversionModal(true);
              }}
              className="w-full"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Currency Conversion Modal */}
      <CurrencyConversionModal
        open={showConversionModal}
        onOpenChange={setShowConversionModal}
        currencyBreakdown={adjustedBreakdown}
        onConversionComplete={fetchConversions}
        conversions={conversions}
      />

      {/* Hand History Export Modal */}
      <HandHistoryExportModal
        open={showHandExport}
        onOpenChange={setShowHandExport}
      />
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(StatsQuickView);
