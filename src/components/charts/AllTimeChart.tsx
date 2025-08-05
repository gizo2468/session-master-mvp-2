import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AllTimeChartFilters } from './AllTimeChartFilters';
import { AllTimeChartDisplay } from './AllTimeChartDisplay';
import { useAllTimeChartData } from '@/hooks/useAllTimeChartData';

const AllTimeChart: React.FC = () => {
  const {
    loading,
    chartData,
    filteredData,
    dateRange,
    setDateRange,
    isMonthlyView,
    isWeeklyView,
    isDailyView,
    isLast30DaysView,
    resetDateRange,
    toggleMonthlyView,
    toggleWeeklyView,
    toggleDailyView,
    toggleLast30DaysView
  } = useAllTimeChartData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Time Chart</CardTitle>
        <AllTimeChartFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          isMonthlyView={isMonthlyView}
          isWeeklyView={isWeeklyView}
          isDailyView={isDailyView}
          isLast30DaysView={isLast30DaysView}
          resetDateRange={resetDateRange}
          toggleMonthlyView={toggleMonthlyView}
          toggleWeeklyView={toggleWeeklyView}
          toggleDailyView={toggleDailyView}
          toggleLast30DaysView={toggleLast30DaysView}
        />
      </CardHeader>
      <CardContent>
        <AllTimeChartDisplay
          loading={loading}
          chartData={chartData}
          filteredData={filteredData}
          dateRange={dateRange}
          isMonthlyView={isMonthlyView}
          isWeeklyView={isWeeklyView}
          isDailyView={isDailyView}
          isLast30DaysView={isLast30DaysView}
        />
      </CardContent>
    </Card>
  );
};

export default AllTimeChart;