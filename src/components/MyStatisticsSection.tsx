import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, FileDown } from 'lucide-react';
import { formatDuration, formatPercentage, formatRatio, formatCurrency } from '@/utils/statisticsCalculator';
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate';
import { FilterOptions } from './StatisticsFilterModal';
import useUnifiedSessionStats from '@/hooks/useUnifiedSessionStats';

// Remove local currency formatter - use the one from utils
interface StatCellProps {
  label: string;
  value: string;
  isPositive?: boolean | null;
  isEmpty?: boolean;
}

const StatCell: React.FC<StatCellProps> = ({ label, value, isPositive = null, isEmpty = false }) => {
  if (isEmpty) {
    return (
      <div className="text-center p-2 sm:p-3 flex flex-col justify-between min-h-[4rem] sm:min-h-[5rem]">
        {/* Empty cell */}
      </div>
    );
  }

  let colorClass = '';
  if (isPositive !== null) {
    colorClass = isPositive ? 'text-green-600' : 'text-red-600';
  }

  return (
    <div className="text-center p-2 sm:p-3 flex flex-col justify-between min-h-[4rem] sm:min-h-[5rem]">
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-1 leading-tight h-8 sm:h-10 flex items-center justify-center">
        {label}
      </p>
      <p className={`text-lg sm:text-2xl font-bold flex items-center justify-center ${colorClass}`}>
        {value}
      </p>
    </div>
  );
};

interface MyStatisticsSectionProps {
  onFilterClick: () => void;
  onExportPDF?: (activeTab: string, statistics: any, defaultCurrency: string) => void;
  onRegisterExportFunction?: (exportFn: () => void) => void;
  filters?: FilterOptions;
}

export const MyStatisticsSection: React.FC<MyStatisticsSectionProps> = ({ onFilterClick, onExportPDF, onRegisterExportFunction, filters }) => {
  return (
    <PremiumFeatureGate
      featureName="My Finance & My Notes"
      description="Unlock more powerful tools and insights to improve your game with Premium."
    >
      <MyStatisticsContent onFilterClick={onFilterClick} onExportPDF={onExportPDF} onRegisterExportFunction={onRegisterExportFunction} filters={filters} />
    </PremiumFeatureGate>
  );
};

const MyStatisticsContent: React.FC<MyStatisticsSectionProps> = ({ onFilterClick, onExportPDF, onRegisterExportFunction, filters }) => {
  const [activeTab, setActiveTab] = useState('sessions');
  
  // Use the unified statistics hook with filters
  const { 
    statistics, 
    getStatsForScope, 
    isLoading, 
    error, 
    defaultCurrency 
  } = useUnifiedSessionStats(filters);

  // Register export function when component mounts or data changes
  React.useEffect(() => {
    if (onRegisterExportFunction && !isLoading && statistics) {
      const exportFunction = () => {
        onExportPDF?.(activeTab, statistics, defaultCurrency);
      };
      onRegisterExportFunction(exportFunction);
    }
  }, [onRegisterExportFunction, activeTab, statistics, defaultCurrency, isLoading, onExportPDF]);

  // Get current statistics based on active tab
  const getCurrentStats = () => {
    switch (activeTab) {
      case 'cash':
        return getStatsForScope('cash');
      case 'tournaments':
        return getStatsForScope('tournaments');
      default:
        return getStatsForScope('all');
    }
  };

  const currentStats = getCurrentStats();

  if (isLoading || !currentStats) {
    return (
      <div className="bg-white dark:bg-card rounded-lg p-4 sm:p-6 shadow-sm dark:shadow-black/20">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-primary">My Finance</h3>
          <Badge variant="secondary" className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20">
            <FileDown className="h-3 w-3 mr-1" />
            PDF export included
          </Badge>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-card rounded-lg p-4 sm:p-6 shadow-sm dark:shadow-black/20">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-primary">My Finance</h3>
          <Badge variant="secondary" className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20">
            <FileDown className="h-3 w-3 mr-1" />
            PDF export included
          </Badge>
        </div>
        <div className="text-center text-red-500 p-4">
          Failed to load statistics: {error}
        </div>
      </div>
    );
  }

  // Format values for display
  const netResultDisplay = formatCurrency(currentStats.netResult, defaultCurrency);
  const netHourlyDisplay = formatCurrency(currentStats.netHourlyRate, defaultCurrency);
  const avgNetResultDisplay = formatCurrency(currentStats.averageNetResult, defaultCurrency);
  const totalBuyInsDisplay = formatCurrency(currentStats.totalBuyIns, defaultCurrency);
  const totalPayoutsDisplay = formatCurrency(currentStats.totalPayouts, defaultCurrency);
  const avgDurationDisplay = formatDuration(currentStats.averageDuration);
  const totalDurationDisplay = formatDuration(currentStats.totalDuration);
  const winRatioDisplay = formatPercentage(currentStats.winRatio);
  const profitLossRatioDisplay = formatRatio(currentStats.profitLossRatio);

  return (
    <div className="bg-white dark:bg-card rounded-lg p-4 sm:p-6 shadow-sm dark:shadow-black/20">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xl sm:text-2xl font-bold text-primary">My Finance</h3>
        <Badge variant="secondary" className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20">
          <FileDown className="h-3 w-3 mr-1" />
          PDF export included
        </Badge>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center gap-1 sm:gap-2 mb-4">
          <TabsList className="grid grid-cols-3 flex-1 h-9 sm:h-10">
            <TabsTrigger value="sessions" className="text-xs sm:text-sm px-1 sm:px-3">Sessions</TabsTrigger>
            <TabsTrigger value="cash" className="text-xs sm:text-sm px-1 sm:px-3">Cash</TabsTrigger>
            <TabsTrigger value="tournaments" className="text-xs sm:text-sm px-1 sm:px-3">Tournaments</TabsTrigger>
          </TabsList>
          <div className="border-l border-border pl-1 sm:pl-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterClick?.()}
              className="h-9 w-9 sm:h-10 sm:w-10 p-0"
              title="Filter & Export"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="sessions" className="mt-0">
          <div className="grid grid-cols-2 grid-rows-6 gap-3 sm:gap-4">
            <StatCell label="Sessions Results" value={netResultDisplay} isPositive={currentStats?.netResult >= 0} />
            <StatCell label="Net Hourly Rate" value={netHourlyDisplay} isPositive={currentStats?.netHourlyRate >= 0} />
            
            <StatCell label="Average Net Result" value={avgNetResultDisplay} isPositive={currentStats?.averageNetResult >= 0} />
            <StatCell label="Total Buy-ins" value={totalBuyInsDisplay} />
            
            <StatCell label="Average Duration" value={avgDurationDisplay} />
            <StatCell label="Total Duration" value={totalDurationDisplay} />
            
            <StatCell label="Win Ratio" value={winRatioDisplay} />
            <StatCell label="Profit/Loss Ratio" value={profitLossRatioDisplay} />
            
            <StatCell label="Total Tables" value={currentStats?.totalTables.toString() || '0'} />
            <StatCell label="Number of Sessions" value={currentStats?.numberOfSessions.toString() || '0'} />
            
            <StatCell label="Total Payouts" value={totalPayoutsDisplay} />
            <StatCell label="" value="" isEmpty />
          </div>
        </TabsContent>
        
        <TabsContent value="cash" className="mt-0">
          <div className="grid grid-cols-2 grid-rows-6 gap-3 sm:gap-4">
            <StatCell label="Sessions Results" value={formatCurrency(getStatsForScope('cash')?.netResult || 0, defaultCurrency)} isPositive={getStatsForScope('cash')?.netResult >= 0} />
            <StatCell label="Net Hourly Rate" value={formatCurrency(getStatsForScope('cash')?.netHourlyRate || 0, defaultCurrency)} isPositive={getStatsForScope('cash')?.netHourlyRate >= 0} />
            
            <StatCell label="Average Net Result" value={formatCurrency(getStatsForScope('cash')?.averageNetResult || 0, defaultCurrency)} isPositive={getStatsForScope('cash')?.averageNetResult >= 0} />
            <StatCell label="Total Buy-ins" value={formatCurrency(getStatsForScope('cash')?.totalBuyIns || 0, defaultCurrency)} />
            
            <StatCell label="Average Duration" value={formatDuration(getStatsForScope('cash')?.averageDuration || 0)} />
            <StatCell label="Total Duration" value={formatDuration(getStatsForScope('cash')?.totalDuration || 0)} />
            
            <StatCell label="Average BB/100" value={getStatsForScope('cash')?.averageBB100?.toFixed(1) || '0.0'} isPositive={getStatsForScope('cash')?.averageBB100 ? getStatsForScope('cash').averageBB100 >= 0 : null} />
            <StatCell label="Profit/Loss Ratio" value={formatRatio(getStatsForScope('cash')?.profitLossRatio || 0)} />
            
            <StatCell label="Total Tables" value={getStatsForScope('cash')?.totalTables.toString() || '0'} />
            <StatCell label="Hands Count" value={getStatsForScope('cash')?.handsCount.toLocaleString() || '0'} />
            
            <StatCell label="Number of Sessions" value={getStatsForScope('cash')?.numberOfSessions.toString() || '0'} />
            <StatCell label="Total Payouts" value={formatCurrency(getStatsForScope('cash')?.totalPayouts || 0, defaultCurrency)} />
          </div>
        </TabsContent>
        
        <TabsContent value="tournaments" className="mt-0">
          <div className="grid grid-cols-2 grid-rows-6 gap-3 sm:gap-4">
            <StatCell label="Sessions Results" value={formatCurrency(getStatsForScope('tournaments')?.netResult || 0, defaultCurrency)} isPositive={getStatsForScope('tournaments')?.netResult >= 0} />
            <StatCell label="Net Hourly Rate" value={formatCurrency(getStatsForScope('tournaments')?.netHourlyRate || 0, defaultCurrency)} isPositive={getStatsForScope('tournaments')?.netHourlyRate >= 0} />
            
            <StatCell label="Average Net Result" value={formatCurrency(getStatsForScope('tournaments')?.averageNetResult || 0, defaultCurrency)} isPositive={getStatsForScope('tournaments')?.averageNetResult >= 0} />
            <StatCell label="Total Buy-ins" value={formatCurrency(getStatsForScope('tournaments')?.totalBuyIns || 0, defaultCurrency)} />
            
            <StatCell label="Average Duration" value={formatDuration(getStatsForScope('tournaments')?.averageDuration || 0)} />
            <StatCell label="Total Duration" value={formatDuration(getStatsForScope('tournaments')?.totalDuration || 0)} />
            
            <StatCell label="Final Tables" value={getStatsForScope('tournaments')?.finalTables?.toString() || '0'} />
            <StatCell label="First Place Finish" value={getStatsForScope('tournaments')?.firstPlaceFinish?.toString() || '0'} />
            
            <StatCell label="Total Tables" value={getStatsForScope('tournaments')?.totalTables.toString() || '0'} />
            <StatCell label="Hands Count" value={getStatsForScope('tournaments')?.handsCount.toLocaleString() || '0'} />
            
            <StatCell label="Number of Sessions" value={getStatsForScope('tournaments')?.numberOfSessions.toString() || '0'} />
            <StatCell label="Total Payouts" value={formatCurrency(getStatsForScope('tournaments')?.totalPayouts || 0, defaultCurrency)} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};