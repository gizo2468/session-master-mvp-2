import { useState, useEffect } from 'react';
import { fetchUserSessions } from '@/utils/database/sessionFetcher';
import { PokerSession } from '@/types/poker';
import { processAllTimeData, processMonthlyData } from '@/utils/allTimeChartUtils';

interface ChartDataPoint {
  date: string;
  profit: number;
  cumulativeProfit: number;
  sessionCount: number;
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

  useEffect(() => {
    loadSessionData();
  }, []);

  useEffect(() => {
    if (isMonthlyView) {
      displayMonthlyView();
    } else {
      filterDataByDateRange();
    }
  }, [chartData, dateRange, isMonthlyView, sessions]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const userSessions = await fetchUserSessions();
      
      // Filter completed sessions only and sort by date
      const completedSessions = userSessions
        .filter(session => !session.isActive && session.endTime)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      setSessions(completedSessions);
      
      // Process daily session data by default (All Time view)
      const dailySessionData = processAllTimeData(completedSessions);
      setChartData(dailySessionData);
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDataByDateRange = () => {
    const hasDateFilter = dateRange.start || dateRange.end;
    
    if (!hasDateFilter) {
      // No filter - show all time session data
      const allTimeData = processAllTimeData(sessions);
      setFilteredData(allTimeData);
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

  const resetDateRange = () => {
    setDateRange({ start: '', end: '' });
    setIsMonthlyView(false);
  };

  const toggleMonthlyView = () => {
    setIsMonthlyView(!isMonthlyView);
    // Clear date range when switching to monthly view
    if (!isMonthlyView) {
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
    resetDateRange,
    toggleMonthlyView
  };
};