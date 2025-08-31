import { useState, useEffect } from 'react';
import { fetchUserSessions } from '@/utils/database/sessionFetcher';
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
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [filteredData, setFilteredData] = useState<ChartDataPoint[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isMonthlyView, setIsMonthlyView] = useState(false);
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const [isDailyView, setIsDailyView] = useState(false);
  const [isLast30DaysView, setIsLast30DaysView] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(['USD']);

  // Load initial session data on mount
  useEffect(() => {
    loadSessionData();
  }, []);

  // Effect to process data based on view/date range changes and currency filter
  useEffect(() => {
    if (chartData.length === 0) return;
    
    console.log('Processing chart data based on current filters, currency:', selectedCurrency);
    
    // First filter by currency
    const currencyFilteredData = chartData.filter(point => point.currency === selectedCurrency);
    
    if (dateRange.start && dateRange.end) {
      filterDataByDateRange(currencyFilteredData);
    } else if (isMonthlyView) {
      displayMonthlyView(currencyFilteredData);
    } else if (isWeeklyView) {
      displayWeeklyView(currencyFilteredData);
    } else if (isDailyView) {
      displayDailyView(currencyFilteredData);
    } else if (isLast30DaysView) {
      displayLast30DaysView(currencyFilteredData);
    } else {
      // Default to all-time view with currency filter
      setFilteredData(currencyFilteredData);
    }
  }, [chartData, dateRange, isMonthlyView, isWeeklyView, isDailyView, isLast30DaysView, selectedCurrency]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const userSessions = await fetchUserSessions();
      const completedSessions = userSessions.filter(session => session.status === 'completed');
      const sortedSessions = completedSessions.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      // Extract available currencies from sessions
      const currencies = [...new Set(sortedSessions.map(session => session.currency || 'USD'))].sort();
      setAvailableCurrencies(currencies.length > 0 ? currencies : ['USD']);
      
      // Set default currency to the first available one or USD
      if (currencies.length > 0 && !currencies.includes(selectedCurrency)) {
        setSelectedCurrency(currencies.includes('USD') ? 'USD' : currencies[0]);
      } else if (currencies.length === 0) {
        setSelectedCurrency('USD');
      }
      
      console.log('Sorted sessions for chart:', sortedSessions);
      console.log('Available currencies:', currencies);
      
      const tableBasedData = processTableBasedData(sortedSessions);
      setChartData(tableBasedData);
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDataByDateRange = async (currencyData?: ChartDataPoint[]) => {
    if (currencyData) {
      // Use pre-filtered currency data and filter by date range
      const filteredByDate = currencyData.filter(point => {
        return point.date >= dateRange.start && point.date <= dateRange.end;
      });
      setFilteredData(filteredByDate);
    } else {
      const userSessions = await fetchUserSessions();
      const completedSessions = userSessions.filter(session => session.status === 'completed');
      
      const filteredSessions = completedSessions.filter(session => {
        const sessionDate = format(new Date(session.startTime), 'yyyy-MM-dd');
        const currency = session.currency || 'USD';
        return sessionDate >= dateRange.start && sessionDate <= dateRange.end && currency === selectedCurrency;
      });
      
      const sortedSessions = filteredSessions.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      const processedData = processAllTimeData(sortedSessions);
      setFilteredData(processedData);
    }
  };

  const displayMonthlyView = async (currencyData?: ChartDataPoint[]) => {
    const userSessions = await fetchUserSessions();
    const completedSessions = userSessions.filter(session => 
      session.status === 'completed' && (session.currency || 'USD') === selectedCurrency
    );
    const monthlyData = processMonthlyData(completedSessions);
    setFilteredData(monthlyData);
  };

  const displayWeeklyView = async (currencyData?: ChartDataPoint[]) => {
    const userSessions = await fetchUserSessions();
    const completedSessions = userSessions.filter(session => 
      session.status === 'completed' && (session.currency || 'USD') === selectedCurrency
    );
    const weeklyData = processWeeklyData(completedSessions);
    setFilteredData(weeklyData);
  };

  const displayDailyView = async (currencyData?: ChartDataPoint[]) => {
    const userSessions = await fetchUserSessions();
    const completedSessions = userSessions.filter(session => 
      session.status === 'completed' && (session.currency || 'USD') === selectedCurrency
    );
    const dailyData = processDailyData(completedSessions);
    setFilteredData(dailyData);
  };

  const displayLast30DaysView = async (currencyData?: ChartDataPoint[]) => {
    const userSessions = await fetchUserSessions();
    const completedSessions = userSessions.filter(session => 
      session.status === 'completed' && (session.currency || 'USD') === selectedCurrency
    );
    const last30DaysData = processLast30DaysData(completedSessions);
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
    loading,
    chartData,
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