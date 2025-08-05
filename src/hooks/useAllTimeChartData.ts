import { useState, useEffect } from 'react';
import { fetchUserSessions } from '@/utils/database/sessionFetcher';
import { PokerSession } from '@/types/poker';
import { processAllTimeData, processMonthlyData, processWeeklyData, processDailyData, processLast30DaysData, processTableBasedData } from '@/utils/allTimeChartUtils';

interface ChartDataPoint {
  date: string;
  profit: number;
  cumulativeProfit: number;
  sessionCount: number;
  tableCount?: number;
}

export const useAllTimeChartData = () => {
  const [sessions, setSessions] = useState<PokerSession[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({
    start: '',
    end: ''
  });
  const [filteredData, setFilteredData] = useState<ChartDataPoint[]>([]);
  const [isMonthlyView, setIsMonthlyView] = useState(false);
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const [isDailyView, setIsDailyView] = useState(false);
  const [isLast30DaysView, setIsLast30DaysView] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, []);

  useEffect(() => {
    if (isWeeklyView) {
      displayWeeklyView();
    } else if (isMonthlyView) {
      displayMonthlyView();
    } else if (isDailyView) {
      displayDailyView();
    } else if (isLast30DaysView) {
      displayLast30DaysView();
    } else {
      filterDataByDateRange();
    }
  }, [chartData, dateRange, isMonthlyView, isWeeklyView, isDailyView, isLast30DaysView, sessions]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const userSessions = await fetchUserSessions();
      
      // Filter completed sessions only and sort by date
      const completedSessions = userSessions
        .filter(session => !session.isActive && session.endTime)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      setSessions(completedSessions);
      
      // Process table-based data by default (All Time view)
      const tableBasedData = processTableBasedData(completedSessions);
      setChartData(tableBasedData);
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDataByDateRange = () => {
    const hasDateFilter = dateRange.start || dateRange.end;
    
    if (!hasDateFilter) {
      // No filter - show table-based data for All Time view
      const tableBasedData = processTableBasedData(sessions);
      setFilteredData(tableBasedData);
      return;
    }

    // Date filter applied - filter sessions by date range
    const startDate = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : new Date(sessions[0]?.startTime || new Date());
    const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : new Date();
    
    const filteredSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
    
    let filteredAllTimeData = processAllTimeData(filteredSessions);
    
    // For date-filtered view, ensure chart ends with the selected end date
    if (dateRange.end) {
      const endDateString = new Date(dateRange.end).toISOString().split('T')[0];
      const lastPoint = filteredAllTimeData[filteredAllTimeData.length - 1];
      
      if (!lastPoint || lastPoint.date < endDateString) {
        filteredAllTimeData.push({
          date: endDateString,
          profit: 0,
          cumulativeProfit: lastPoint ? lastPoint.cumulativeProfit : 0,
          sessionCount: 0
        });
      }
    }
    
    setFilteredData(filteredAllTimeData);
  };

  const displayMonthlyView = () => {
    const monthlyData = processMonthlyData(sessions);
    setFilteredData(monthlyData);
  };

  const displayWeeklyView = () => {
    const weeklyData = processWeeklyData(sessions);
    setFilteredData(weeklyData);
  };

  const displayDailyView = () => {
    const dailyData = processDailyData(sessions);
    setFilteredData(dailyData);
  };

  const displayLast30DaysView = () => {
    const last30DaysData = processLast30DaysData(sessions);
    setFilteredData(last30DaysData);
  };

  const resetDateRange = () => {
    setDateRange({ start: '', end: '' });
    setIsMonthlyView(false);
    setIsWeeklyView(false);
    setIsDailyView(false);
    setIsLast30DaysView(false);
  };

  const toggleMonthlyView = () => {
    setIsMonthlyView(!isMonthlyView);
    setIsWeeklyView(false);
    setIsDailyView(false);
    setIsLast30DaysView(false);
    // Clear date range when switching to monthly view
    if (!isMonthlyView) {
      setDateRange({ start: '', end: '' });
    }
  };

  const toggleWeeklyView = () => {
    setIsWeeklyView(!isWeeklyView);
    setIsMonthlyView(false);
    setIsDailyView(false);
    setIsLast30DaysView(false);
    // Clear date range when switching to weekly view
    if (!isWeeklyView) {
      setDateRange({ start: '', end: '' });
    }
  };

  const toggleDailyView = () => {
    setIsDailyView(!isDailyView);
    setIsMonthlyView(false);
    setIsWeeklyView(false);
    setIsLast30DaysView(false);
    // Clear date range when switching to daily view
    if (!isDailyView) {
      setDateRange({ start: '', end: '' });
    }
  };

  const toggleLast30DaysView = () => {
    setIsLast30DaysView(!isLast30DaysView);
    setIsMonthlyView(false);
    setIsWeeklyView(false);
    setIsDailyView(false);
    // Clear date range when switching to Last 30 Days view
    if (!isLast30DaysView) {
      setDateRange({ start: '', end: '' });
    }
  };

  return {
    sessions,
    chartData,
    loading,
    dateRange,
    setDateRange,
    filteredData,
    isMonthlyView,
    isWeeklyView,
    isDailyView,
    isLast30DaysView,
    resetDateRange,
    toggleMonthlyView,
    toggleWeeklyView,
    toggleDailyView,
    toggleLast30DaysView
  };
};