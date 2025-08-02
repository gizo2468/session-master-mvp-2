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
    resetDateRange,
    toggleMonthlyView,
    toggleWeeklyView
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
          resetDateRange={resetDateRange}
          toggleMonthlyView={toggleMonthlyView}
          toggleWeeklyView={toggleWeeklyView}
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
        />
      </CardContent>
    </Card>
  );
};

export default AllTimeChart;