import { useState, useEffect, useMemo } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { PokerSession } from '@/types/poker';
import { processAllTimeData, processMonthlyData, processWeeklyData, processDailyData, processLast30DaysData, processTableBasedData } from '@/utils/allTimeChartUtils';
import { format } from 'date-fns';

interface ChartDataPoint {
  date: string;
  profit: number;
  cumulativeProfit: number;
  sessionCount: number;
  tableCount?: number;
  currency?: string;
  tableName?: string;
}

export const useAllTimeChartData = () => {
  const { sessions, isLoading: contextLoading } = useSessionContext();
  
  const [filteredData, setFilteredData] = useState<ChartDataPoint[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isMonthlyView, setIsMonthlyView] = useState(false);
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const [isDailyView, setIsDailyView] = useState(false);
  const [isLast30DaysView, setIsLast30DaysView] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  // Derive completed sessions from context - memoized
  const completedSessions = useMemo(() => {
    return sessions.filter(session => !session.isActive && session.cashOut !== undefined);
  }, [sessions]);

  // Extract available currencies - memoized
  const availableCurrencies = useMemo(() => {
    const currencies = [...new Set(completedSessions.map(session => session.currency || 'USD'))].sort();
    return currencies.length > 0 ? currencies : ['USD'];
  }, [completedSessions]);

  // Set default currency when available currencies change
  useEffect(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.includes(selectedCurrency)) {
      const defaultCurrency = availableCurrencies.includes('USD') ? 'USD' : availableCurrencies[0];
      setSelectedCurrency(defaultCurrency);
    }
  }, [availableCurrencies, selectedCurrency]);

  // Process data when filters or sessions change
  useEffect(() => {
    if (completedSessions.length === 0) {
      setFilteredData([]);
      return;
    }

    processDataWithCurrentFilters();
  }, [completedSessions, dateRange, isMonthlyView, isWeeklyView, isDailyView, isLast30DaysView, selectedCurrency]);

  const processDataWithCurrentFilters = () => {
    // Filter sessions by selected currency
    const currencyFilteredSessions = completedSessions.filter(session => 
      (session.currency || 'USD') === selectedCurrency
    );
    
    const sortedSessions = currencyFilteredSessions.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    if (dateRange.start && dateRange.end) {
      filterDataByDateRange(sortedSessions);
    } else if (isMonthlyView) {
      const monthlyData = processMonthlyData(sortedSessions);
      setFilteredData(monthlyData);
    } else if (isWeeklyView) {
      const weeklyData = processWeeklyData(sortedSessions);
      setFilteredData(weeklyData);
    } else if (isDailyView) {
      const dailyData = processDailyData(sortedSessions);
      setFilteredData(dailyData);
    } else if (isLast30DaysView) {
      const last30DaysData = processLast30DaysData(sortedSessions);
      setFilteredData(last30DaysData);
    } else {
      // Default to all-time view - use table-based for detailed view
      const tableBasedData = processTableBasedData(sortedSessions);
      setFilteredData(tableBasedData);
    }
  };

  const filterDataByDateRange = (sessions: PokerSession[]) => {
    const filteredSessions = sessions.filter(session => {
      const sessionDate = format(new Date(session.startTime), 'yyyy-MM-dd');
      return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
    });
    
    const processedData = processAllTimeData(filteredSessions);
    setFilteredData(processedData);
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
    if (!isMonthlyView) {
      setDateRange({ start: '', end: '' });
    }
  };

  const toggleWeeklyView = () => {
    setIsWeeklyView(!isWeeklyView);
    setIsMonthlyView(false);
    setIsDailyView(false);
    setIsLast30DaysView(false);
    if (!isWeeklyView) {
      setDateRange({ start: '', end: '' });
    }
  };

  const toggleDailyView = () => {
    setIsDailyView(!isDailyView);
    setIsMonthlyView(false);
    setIsWeeklyView(false);
    setIsLast30DaysView(false);
    if (!isDailyView) {
      setDateRange({ start: '', end: '' });
    }
  };

  const toggleLast30DaysView = () => {
    setIsLast30DaysView(!isLast30DaysView);
    setIsMonthlyView(false);
    setIsWeeklyView(false);
    setIsDailyView(false);
    if (!isLast30DaysView) {
      setDateRange({ start: '', end: '' });
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

  return {
    loading: contextLoading,
    filteredData,
    dateRange,
    setDateRange,
    isMonthlyView,
    isWeeklyView,
    isDailyView,
    isLast30DaysView,
    selectedCurrency,
    availableCurrencies,
    resetDateRange,
    toggleMonthlyView,
    toggleWeeklyView,
    toggleDailyView,
    toggleLast30DaysView,
    onCurrencyChange: handleCurrencyChange
  };
};
