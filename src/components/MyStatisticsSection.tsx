import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDuration, formatPercentage, formatRatio } from '@/utils/statisticsCalculator';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';
import { useStatisticsData } from '@/hooks/useStatisticsData';

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
      <p className="text-xs sm:text-sm text-gray-600 mb-1 leading-tight h-8 sm:h-10 flex items-center justify-center">
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
}

export const MyStatisticsSection: React.FC<MyStatisticsSectionProps> = ({ onFilterClick }) => {
  const [activeTab, setActiveTab] = useState('sessions');
  const { defaultCurrency } = useDefaultCurrency();
  
  // Get statistics from Supabase
  const { statisticsData, isLoading, error } = useStatisticsData();

  // Helper function to get stats based on active tab
  const getStats = () => {
    if (!statisticsData.all) return null;
    
    switch (activeTab) {
      case 'cash':
        return statisticsData.cash;
      case 'tournaments':
        return statisticsData.tournaments;
      default:
        return statisticsData.all;
    }
  };

  const currentStats = getStats();

  if (isLoading || !currentStats) {
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg sm:text-xl font-bold mb-4 text-primary text-center">My Statistics</h3>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg sm:text-xl font-bold mb-4 text-primary text-center">My Statistics</h3>
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
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg sm:text-xl font-bold mb-4 text-primary text-center">My Statistics</h3>
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
              onClick={onFilterClick}
              className="h-9 w-9 sm:h-10 sm:w-10 p-0"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="sessions" className="mt-0">
          <div className="grid grid-cols-2 grid-rows-6 gap-3 sm:gap-4">
            <StatCell label="Net Result" value={netResultDisplay} isPositive={statisticsData.all?.netResult >= 0} />
            <StatCell label="Net Hourly Rate" value={netHourlyDisplay} isPositive={statisticsData.all?.netHourlyRate >= 0} />
            
            <StatCell label="Average Net Result" value={avgNetResultDisplay} isPositive={statisticsData.all?.averageNetResult >= 0} />
            <StatCell label="Total Buy-ins" value={totalBuyInsDisplay} />
            
            <StatCell label="Average Duration" value={avgDurationDisplay} />
            <StatCell label="Total Duration" value={totalDurationDisplay} />
            
            <StatCell label="Win Ratio" value={winRatioDisplay} />
            <StatCell label="Profit/Loss Ratio" value={profitLossRatioDisplay} />
            
            <StatCell label="Total Tables" value={statisticsData.all?.totalTables.toString() || '0'} />
            <StatCell label="Number of Sessions" value={statisticsData.all?.numberOfSessions.toString() || '0'} />
            
            <StatCell label="Total Payouts" value={formatCurrency(statisticsData.all?.totalPayouts || 0, defaultCurrency)} />
            <StatCell label="" value="" isEmpty />
          </div>
        </TabsContent>
        
        <TabsContent value="cash" className="mt-0">
          <div className="grid grid-cols-2 grid-rows-6 gap-3 sm:gap-4">
            <StatCell label="Net Result" value={formatCurrency(statisticsData.cash?.netResult || 0, defaultCurrency)} isPositive={statisticsData.cash?.netResult >= 0} />
            <StatCell label="Net Hourly Rate" value={formatCurrency(statisticsData.cash?.netHourlyRate || 0, defaultCurrency)} isPositive={statisticsData.cash?.netHourlyRate >= 0} />
            
            <StatCell label="Average Net Result" value={formatCurrency(statisticsData.cash?.averageNetResult || 0, defaultCurrency)} isPositive={statisticsData.cash?.averageNetResult >= 0} />
            <StatCell label="Total Buy-ins" value={formatCurrency(statisticsData.cash?.totalBuyIns || 0, defaultCurrency)} />
            
            <StatCell label="Average Duration" value={formatDuration(statisticsData.cash?.averageDuration || 0)} />
            <StatCell label="Total Duration" value={formatDuration(statisticsData.cash?.totalDuration || 0)} />
            
            <StatCell label="Average BB/100" value={statisticsData.cash?.averageBB100?.toFixed(1) || '0.0'} isPositive={statisticsData.cash?.averageBB100 ? statisticsData.cash.averageBB100 >= 0 : null} />
            <StatCell label="Profit/Loss Ratio" value={formatRatio(statisticsData.cash?.profitLossRatio || 0)} />
            
            <StatCell label="Total Tables" value={statisticsData.cash?.totalTables.toString() || '0'} />
            <StatCell label="Hands Count" value={statisticsData.cash?.handsCount.toLocaleString() || '0'} />
            
            <StatCell label="Number of Sessions" value={statisticsData.cash?.numberOfSessions.toString() || '0'} />
            <StatCell label="Total Payouts" value={formatCurrency(statisticsData.cash?.totalPayouts || 0, defaultCurrency)} />
          </div>
        </TabsContent>
        
        <TabsContent value="tournaments" className="mt-0">
          <div className="grid grid-cols-2 grid-rows-6 gap-3 sm:gap-4">
            <StatCell label="Net Result" value={formatCurrency(statisticsData.tournaments?.netResult || 0, defaultCurrency)} isPositive={statisticsData.tournaments?.netResult >= 0} />
            <StatCell label="Net Hourly Rate" value={formatCurrency(statisticsData.tournaments?.netHourlyRate || 0, defaultCurrency)} isPositive={statisticsData.tournaments?.netHourlyRate >= 0} />
            
            <StatCell label="Average Net Result" value={formatCurrency(statisticsData.tournaments?.averageNetResult || 0, defaultCurrency)} isPositive={statisticsData.tournaments?.averageNetResult >= 0} />
            <StatCell label="Total Buy-ins" value={formatCurrency(statisticsData.tournaments?.totalBuyIns || 0, defaultCurrency)} />
            
            <StatCell label="Average Duration" value={formatDuration(statisticsData.tournaments?.averageDuration || 0)} />
            <StatCell label="Total Duration" value={formatDuration(statisticsData.tournaments?.totalDuration || 0)} />
            
            <StatCell label="Final Tables" value={statisticsData.tournaments?.finalTables?.toString() || '0'} />
            <StatCell label="First Place Finish" value={statisticsData.tournaments?.firstPlaceFinish?.toString() || '0'} />
            
            <StatCell label="Total Tables" value={statisticsData.tournaments?.totalTables.toString() || '0'} />
            <StatCell label="Hands Count" value={statisticsData.tournaments?.handsCount.toLocaleString() || '0'} />
            
            <StatCell label="Number of Sessions" value={statisticsData.tournaments?.numberOfSessions.toString() || '0'} />
            <StatCell label="Total Payouts" value={formatCurrency(statisticsData.tournaments?.totalPayouts || 0, defaultCurrency)} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};