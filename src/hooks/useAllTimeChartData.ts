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
    // Only process data if we have a selected currency (indicating data has been loaded)
    if (selectedCurrency && availableCurrencies.length > 0) {
      processDataWithCurrentFilters();
    }
  }, [dateRange, isMonthlyView, isWeeklyView, isDailyView, isLast30DaysView, selectedCurrency, availableCurrencies]);

  const processInitialData = async (sessions: any[], currency: string) => {
    console.log(`=== CURRENCY FILTERING FOR ${currency} ===`);
    console.log('All sessions before currency filter:', sessions.length);
    
    // Log each session's currency for debugging
    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1} currency check:`, {
        sessionCurrency: session.currency,
        targetCurrency: currency,
        matches: (session.currency || 'USD') === currency
      });
    });
    
    // Filter sessions by selected currency
    const currencyFilteredSessions = sessions.filter(session => 
      (session.currency || 'USD') === currency
    );
    
    console.log(`Sessions after ${currency} filter:`, currencyFilteredSessions.length);
    
    const sortedSessions = currencyFilteredSessions.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    console.log(`=== PROCESSING ${currency} SESSIONS ===`);
    console.log(`Sorted sessions for currency ${currency}:`, sortedSessions.length);

    // Default to all-time view - use table-based for detailed view
    const tableBasedData = processTableBasedData(sortedSessions);
    console.log(`Processed table-based data for ${currency}:`, tableBasedData.length, 'data points');
    setFilteredData(tableBasedData);
  };

  const processDataWithCurrentFilters = async () => {
    try {
      setLoading(true);
      const userSessions = await fetchUserSessions();
      // For charts, we want sessions that are not currently active (ended sessions)
      const completedSessions = userSessions.filter(session => !session.isActive && session.cashOut !== undefined);
      
      // Filter sessions by selected currency
      const currencyFilteredSessions = completedSessions.filter(session => 
        (session.currency || 'USD') === selectedCurrency
      );
      
      const sortedSessions = currencyFilteredSessions.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      console.log(`Processing data for currency ${selectedCurrency}:`, sortedSessions);

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
    } catch (error) {
      console.error('Error processing chart data:', error);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const userSessions = await fetchUserSessions();
      console.log('=== ALL FETCHED SESSIONS ===');
      console.log('Total sessions fetched:', userSessions.length);
      
      // Log detailed currency information for each session
      userSessions.forEach((session, index) => {
        console.log(`Session ${index + 1}:`, {
          id: session.id,
          status: session.currentStatus,
          isActive: session.isActive,
          currency: session.currency,
          currencyType: typeof session.currency,
          startTime: session.startTime,
          buyIn: session.buyIn,
          cashOut: session.cashOut
        });
      });
      
      // For charts, we want sessions that are not currently active (ended sessions)  
      const completedSessions = userSessions.filter(session => !session.isActive && session.cashOut !== undefined);
      console.log('=== COMPLETED SESSIONS FILTER ===');
      console.log('Completed sessions after filter:', completedSessions.length);
      
      completedSessions.forEach((session, index) => {
        console.log(`Completed session ${index + 1}:`, {
          id: session.id,
          currency: session.currency,
          status: session.currentStatus
        });
      });
      
      // Extract available currencies from sessions
      const currencies = [...new Set(completedSessions.map(session => session.currency || 'USD'))].sort();
      console.log('=== CURRENCY EXTRACTION ===');
      console.log('Raw currencies from sessions:', completedSessions.map(s => s.currency));
      console.log('Unique currencies found:', currencies);
      
      setAvailableCurrencies(currencies.length > 0 ? currencies : ['USD']);
      
      // Set default currency to USD if available, otherwise first available currency
      const defaultCurrency = currencies.length > 0 ? 
        (currencies.includes('USD') ? 'USD' : currencies[0]) : 'USD';
      
      console.log('=== CURRENCY SELECTION ===');
      console.log('Setting default currency to:', defaultCurrency);
      setSelectedCurrency(defaultCurrency);
      
      // If we have sessions, trigger initial data processing
      if (completedSessions.length > 0) {
        console.log('=== INITIAL DATA PROCESSING ===');
        console.log('Processing initial data for currency:', defaultCurrency);
        await processInitialData(completedSessions, defaultCurrency);
      } else {
        console.log('No completed sessions found');
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      setFilteredData([]);
    } finally {
      setLoading(false);
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
    loading,
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