import React, { useState } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { calculateSessionStatistics, SessionFormat, formatCurrency, formatDuration, formatPercentage, formatRatio } from '@/utils/statisticsCalculator';
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency';

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
  const { sessions, isLoading } = useSessionContext();
  const { defaultCurrency } = useDefaultCurrency();

  // Calculate statistics for each tab
  const allStats = calculateSessionStatistics(sessions, 'all');
  const cashStats = calculateSessionStatistics(sessions, 'cash');
  const tournamentStats = calculateSessionStatistics(sessions, 'tournament');

  // Helper function to get stats based on active tab
  const getStats = () => {
    switch (activeTab) {
      case 'cash':
        return cashStats;
      case 'tournaments':
        return tournamentStats;
      default:
        return allStats;
    }
  };

  const currentStats = getStats();

  // Format values for display
  const netResultDisplay = formatCurrency(currentStats.netResult, defaultCurrency);
  const netHourlyDisplay = formatCurrency(currentStats.netHourlyRate, defaultCurrency);
  const avgNetResultDisplay = formatCurrency(currentStats.averageNetResult, defaultCurrency);
  const totalBuyInsDisplay = formatCurrency(currentStats.totalBuyIns, defaultCurrency);
  const avgDurationDisplay = formatDuration(currentStats.averageDuration);
  const totalDurationDisplay = formatDuration(currentStats.totalDuration);
  const winRatioDisplay = formatPercentage(currentStats.winRatio);
  const profitLossRatioDisplay = formatRatio(currentStats.profitLossRatio);

  if (isLoading) {
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
          <div className="grid grid-cols-2 grid-rows-5 gap-3 sm:gap-4">
            <StatCell label="Net Result" value={netResultDisplay} isPositive={allStats.netResult >= 0} />
            <StatCell label="Net Hourly Rate" value={netHourlyDisplay} isPositive={allStats.netHourlyRate >= 0} />
            
            <StatCell label="Average Net Result" value={avgNetResultDisplay} isPositive={allStats.averageNetResult >= 0} />
            <StatCell label="Total Buy-ins" value={totalBuyInsDisplay} />
            
            <StatCell label="Average Duration" value={avgDurationDisplay} />
            <StatCell label="Total Duration" value={totalDurationDisplay} />
            
            <StatCell label="Win Ratio" value={winRatioDisplay} />
            <StatCell label="Profit/Loss Ratio" value={profitLossRatioDisplay} />
            
            <StatCell label="Total Tables" value={allStats.totalTables.toString()} />
            <StatCell label="Number of Sessions" value={allStats.numberOfSessions.toString()} />
          </div>
        </TabsContent>
        
        <TabsContent value="cash" className="mt-0">
          <div className="grid grid-cols-2 grid-rows-6 gap-3 sm:gap-4">
            <StatCell label="Net Result" value={formatCurrency(cashStats.netResult, defaultCurrency)} isPositive={cashStats.netResult >= 0} />
            <StatCell label="Net Hourly Rate" value={formatCurrency(cashStats.netHourlyRate, defaultCurrency)} isPositive={cashStats.netHourlyRate >= 0} />
            
            <StatCell label="Average Net Result" value={formatCurrency(cashStats.averageNetResult, defaultCurrency)} isPositive={cashStats.averageNetResult >= 0} />
            <StatCell label="Total Buy-ins" value={formatCurrency(cashStats.totalBuyIns, defaultCurrency)} />
            
            <StatCell label="Average Duration" value={formatDuration(cashStats.averageDuration)} />
            <StatCell label="Total Duration" value={formatDuration(cashStats.totalDuration)} />
            
            <StatCell label="Average BB/100" value={cashStats.averageBB100?.toFixed(1) || '0.0'} isPositive={cashStats.averageBB100 ? cashStats.averageBB100 >= 0 : null} />
            <StatCell label="Profit/Loss Ratio" value={formatRatio(cashStats.profitLossRatio)} />
            
            <StatCell label="Total Tables" value={cashStats.totalTables.toString()} />
            <StatCell label="Hands Count" value={cashStats.handsCount.toLocaleString()} />
            
            <StatCell label="Number of Sessions" value={cashStats.numberOfSessions.toString()} />
            <StatCell label="" value="" isEmpty />
          </div>
        </TabsContent>
        
        <TabsContent value="tournaments" className="mt-0">
          <div className="grid grid-cols-2 grid-rows-6 gap-3 sm:gap-4">
            <StatCell label="Net Result" value={formatCurrency(tournamentStats.netResult, defaultCurrency)} isPositive={tournamentStats.netResult >= 0} />
            <StatCell label="Net Hourly Rate" value={formatCurrency(tournamentStats.netHourlyRate, defaultCurrency)} isPositive={tournamentStats.netHourlyRate >= 0} />
            
            <StatCell label="Average Net Result" value={formatCurrency(tournamentStats.averageNetResult, defaultCurrency)} isPositive={tournamentStats.averageNetResult >= 0} />
            <StatCell label="Total Buy-ins" value={formatCurrency(tournamentStats.totalBuyIns, defaultCurrency)} />
            
            <StatCell label="Average Duration" value={formatDuration(tournamentStats.averageDuration)} />
            <StatCell label="Total Duration" value={formatDuration(tournamentStats.totalDuration)} />
            
            <StatCell label="Final Tables" value={tournamentStats.finalTables?.toString() || '0'} />
            <StatCell label="First Place Finish" value={tournamentStats.firstPlaceFinish?.toString() || '0'} />
            
            <StatCell label="Total Tables" value={tournamentStats.totalTables.toString()} />
            <StatCell label="Hands Count" value={tournamentStats.handsCount.toLocaleString()} />
            
            <StatCell label="Number of Sessions" value={tournamentStats.numberOfSessions.toString()} />
            <StatCell label="" value="" isEmpty />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};