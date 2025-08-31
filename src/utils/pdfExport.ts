import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { FilterOptions } from '@/components/StatisticsFilterModal';
import { calculateSessionStatisticsFromDB, formatCurrency, formatDuration, formatPercentage, formatRatio } from './statisticsCalculator';
import { supabase } from '@/integrations/supabase/client';

interface StatData {
  label: string;
  value: string | string[]; // Allow array for multi-currency values
}

interface ExportData {
  activeTab: string;
  stats: StatData[];
  filters: FilterOptions;
  userName?: string;
}

export const generateStatisticsPDFFromDB = async (data: ExportData) => {
  try {
    // Fetch fresh data from Supabase
    const formatMap = { sessions: 'all', cash: 'cash', tournaments: 'tournament' } as const;
    const format = formatMap[data.activeTab as keyof typeof formatMap] || 'all';
    
    // Convert timeframe to backend format - handle all timeframe values
    let timeframe = 'all-time';
    let startDate = data.filters.customStartDate;
    let endDate = data.filters.customEndDate;
    
    if (data.filters.timeframeType === 'custom') {
      timeframe = 'custom';
    } else if (data.filters.timeframeValue === 'This Month') {
      timeframe = 'this-month';
      // Set current month dates
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (data.filters.timeframeValue === 'Last Month') {
      timeframe = 'custom';
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (data.filters.timeframeValue === 'Last 3 Months') {
      timeframe = 'custom';
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (data.filters.timeframeValue === 'This Week') {
      timeframe = 'custom';
      const now = new Date();
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else if (data.filters.timeframeValue === 'Last Week') {
      timeframe = 'custom';
      const now = new Date();
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      startDate = lastWeekStart;
      endDate = new Date(lastWeekStart);
      endDate.setDate(lastWeekStart.getDate() + 6);
    } else if (data.filters.timeframeValue === 'Last 7 Days') {
      timeframe = 'custom';
      const now = new Date();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      endDate = now;
    } else if (data.filters.timeframeValue === 'Last 30 Days') {
      timeframe = 'custom';
      const now = new Date();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29);
      endDate = now;
    } else if (data.filters.timeframeValue === 'Last 90 Days') {
      timeframe = 'custom';
      const now = new Date();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 89);
      endDate = now;
    } else if (data.filters.timeframeValue === 'Last Year') {
      timeframe = 'custom';
      const now = new Date();
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
    } else if (data.filters.timeframeValue === 'This Year') {
      timeframe = 'custom';
      const now = new Date();
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }
    
    // Handle currency filter - get stats per currency or all currencies
    let statsData;
    if (data.filters.currency === 'all') {
      // Get stats for all currencies separately
      statsData = await calculateMultiCurrencyStats(format, timeframe, startDate, endDate);
    } else {
      // Get stats for single currency
      const stats = await calculateSessionStatisticsFromDB(
        format as 'all' | 'cash' | 'tournament',
        timeframe,
        startDate,
        endDate,
        data.filters.currency
      );
      
      const bestSessionResult = await calculateBestSessionResult(format, startDate, endDate, data.filters.currency);
      statsData = formatStatsForPDF(stats, data.activeTab, bestSessionResult, data.filters.currency);
    }

    // Generate PDF with fresh data
    generateStatisticsPDFWithData({
      ...data,
      stats: statsData
    });

  } catch (error) {
    console.error('Failed to generate PDF with fresh data:', error);
    // Fallback to provided data
    generateStatisticsPDFWithData(data);
  }
};

const calculateBestSessionResult = async (format: string, startDate?: Date, endDate?: Date, currency?: string): Promise<number> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return 0;

    let query = supabase
      .from('sessions')
      .select('cash_out, buy_in')
      .eq('user_id', user.user.id)
      .not('end_time', 'is', null); // Only completed sessions

    // Apply format filter
    if (format === 'cash') {
      query = query.eq('format', 'Cash');
    } else if (format === 'tournament') {
      query = query.eq('format', 'Tournament');
    }

    // Apply currency filter
    if (currency && currency !== 'all') {
      query = query.eq('currency', currency);
    }

    // Apply date filters
    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
    }

    const { data: sessions, error } = await query;
    
    if (error || !sessions || sessions.length === 0) {
      return 0;
    }

    // Calculate the best (highest) session result
    const sessionResults = sessions.map(session => 
      (session.cash_out || 0) - (session.buy_in || 0)
    );

    return Math.max(...sessionResults);
  } catch (error) {
    console.error('Error calculating best session result:', error);
    return 0;
  }
};

const calculateMultiCurrencyStats = async (format: string, timeframe: string, startDate?: Date, endDate?: Date): Promise<StatData[]> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    // Get all currencies used by the user
    let currencyQuery = supabase
      .from('sessions')
      .select('currency')
      .eq('user_id', user.user.id)
      .not('currency', 'is', null)
      .not('end_time', 'is', null);

    // Apply format filter
    if (format === 'cash') {
      currencyQuery = currencyQuery.eq('format', 'Cash');
    } else if (format === 'tournament') {
      currencyQuery = currencyQuery.eq('format', 'Tournament');
    }

    // Apply date filters
    if (startDate) {
      currencyQuery = currencyQuery.gte('start_time', startDate.toISOString());
    }
    if (endDate) {
      currencyQuery = currencyQuery.lte('start_time', endDate.toISOString());
    }

    const { data: currencyData, error: currencyError } = await currencyQuery;
    
    if (currencyError || !currencyData) {
      return [];
    }

    // Get unique currencies
    const currencies = [...new Set(currencyData.map(session => session.currency))].filter(Boolean);

    if (currencies.length === 0) {
      return [];
    }

    // Calculate stats for each currency
    const allStats: { [key: string]: { [currency: string]: any } } = {};
    
    for (const currency of currencies) {
      const stats = await calculateSessionStatisticsFromDB(
        format as 'all' | 'cash' | 'tournament',
        timeframe,
        startDate,
        endDate,
        currency as string
      );
      
      const bestSessionResult = await calculateBestSessionResult(format, startDate, endDate, currency as string);
      
      // Store stats by metric name
      Object.entries(stats).forEach(([key, value]) => {
        if (!allStats[key]) allStats[key] = {};
        allStats[key][currency as string] = value;
      });
      
      // Add best session result
      if (!allStats['bestSessionResult']) allStats['bestSessionResult'] = {};
      allStats['bestSessionResult'][currency as string] = bestSessionResult;
    }

    // Format the multi-currency stats
    const formatMultiCurrencyValue = (values: { [currency: string]: any }, formatter: (value: any, currency: string) => string) => {
      return currencies.map(currency => formatter(values[currency as string] || 0, currency as string));
    };

    const formatMultiCurrencyNumber = (values: { [currency: string]: any }) => {
      return currencies.map(currency => (values[currency as string] || 0).toString());
    };

    const baseStats = [
      { label: 'Net Result', value: formatMultiCurrencyValue(allStats.netResult || {}, formatCurrency) },
      { label: 'Net Hourly Rate', value: formatMultiCurrencyValue(allStats.netHourlyRate || {}, formatCurrency) },
      { label: 'Total Buy-ins', value: formatMultiCurrencyValue(allStats.totalBuyIns || {}, formatCurrency) },
      { label: 'Total Duration', value: [formatDuration((allStats.totalDuration && Object.values(allStats.totalDuration).reduce((a: any, b: any) => a + b, 0)) || 0)] },
      { label: 'Total Tables', value: [(allStats.totalTables && Object.values(allStats.totalTables).reduce((a: any, b: any) => a + b, 0) || 0).toString()] },
      { label: 'Number of Sessions', value: [(allStats.numberOfSessions && Object.values(allStats.numberOfSessions).reduce((a: any, b: any) => a + b, 0) || 0).toString()] },
      { label: 'Total Payouts', value: formatMultiCurrencyValue(allStats.totalPayouts || {}, formatCurrency) },
      { label: 'Best Session Result', value: formatMultiCurrencyValue(allStats.bestSessionResult || {}, formatCurrency) },
      { label: 'Win Ratio', value: [formatPercentage((allStats.winRatio && Object.values(allStats.winRatio).reduce((a: any, b: any) => a + b, 0) / currencies.length) || 0)] },
    ];

    return baseStats;
  } catch (error) {
    console.error('Error calculating multi-currency stats:', error);
    return [];
  }
};

const formatStatsForPDF = (stats: any, activeTab: string, bestSessionResult: number, currency?: string): StatData[] => {
  
  // Base stats without the removed fields (Average Net Result, Average Duration, Profit/Loss Ratio)
  const baseStats = [
    { label: 'Net Result', value: formatCurrency(stats.netResult, currency || 'USD') },
    { label: 'Net Hourly Rate', value: formatCurrency(stats.netHourlyRate, currency || 'USD') },
    { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns, currency || 'USD') },
    { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
    { label: 'Total Tables', value: stats.totalTables.toString() },
    { label: 'Number of Sessions', value: stats.numberOfSessions.toString() },
    { label: 'Best Session Result', value: formatCurrency(bestSessionResult, currency || 'USD') },
  ];

  if (activeTab === 'sessions') {
    return [
      ...baseStats.slice(0, 6), // All stats up to Number of Sessions
      { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts, currency || 'USD') },
      { label: 'Best Session Result', value: formatCurrency(bestSessionResult, currency || 'USD') },
      { label: 'Win Ratio', value: formatPercentage(stats.winRatio) },
    ];
  } else if (activeTab === 'cash') {
    return [
      ...baseStats.slice(0, 5), // All stats up to Total Tables
      { label: 'Number of Sessions', value: stats.numberOfSessions.toString() },
      { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts, currency || 'USD') },
      { label: 'Best Session Result', value: formatCurrency(bestSessionResult, currency || 'USD') },
      { label: 'Win Ratio', value: formatPercentage(stats.winRatio) },
      { label: 'Average BB/100', value: stats.averageBB100.toFixed(2) },
      { label: 'Hands Count', value: stats.handsCount.toString() },
    ];
  } else if (activeTab === 'tournaments') {
    return [
      ...baseStats.slice(0, 5), // All stats up to Total Tables
      { label: 'Number of Sessions', value: stats.numberOfSessions.toString() },
      { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts, currency || 'USD') },
      { label: 'Best Session Result', value: formatCurrency(bestSessionResult, currency || 'USD') },
      { label: 'Win Ratio', value: formatPercentage(stats.winRatio) },
      { label: 'Final Tables', value: stats.finalTables.toString() },
      { label: 'First Place Finish', value: stats.firstPlaceFinish.toString() },
      { label: 'Hands Count', value: stats.handsCount.toString() },
    ];
  }

  return [
    ...baseStats,
    { label: 'Win Ratio', value: formatPercentage(stats.winRatio) },
  ];
};

const generateStatisticsPDFWithData = (data: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = margin + 10;
  
  // Logo - SessionMaster (centered)
  try {
    // For jsPDF, we need to use the image as data URL
    // In a production app, you'd convert the logo to base64 at build time
    // For now, we'll use the public path and let jsPDF handle it
    const logoWidth = 60; // Fixed width to prevent stretching
    const logoHeight = 30; // Approximate height maintaining aspect ratio
    const logoX = (pageWidth - logoWidth) / 2; // Center horizontally
    
    // Use the public path for the logo
    doc.addImage('/lovable-uploads/581036dd-5e21-436f-bfa4-32e97f6a4be4.png', 'PNG', logoX, currentY, logoWidth, logoHeight);
    currentY += logoHeight + 10;
  } catch (error) {
    // Fallback to text if image loading fails
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('SessionMaster', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;
  }
  
  // My Statistics Title (olive-green color)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(85, 107, 47); // Olive green color
  doc.text('My Statistics', pageWidth / 2, currentY, { align: 'center' });
  currentY += 25;
  
  // Meta Info Header Block (receipt style)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Calculate date range for timeframe display
  const getDateRangeForTimeframe = (timeframeType: string, timeframeValue: string) => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    if (timeframeType === 'custom') {
      return `Custom Range: ${data.filters.customStartDate ? format(data.filters.customStartDate, 'MMM dd, yyyy') : 'Not set'} - ${data.filters.customEndDate ? format(data.filters.customEndDate, 'MMM dd, yyyy') : 'Not set'}`;
    }

    switch (timeframeValue) {
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'Last 3 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'This Week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'Last Week':
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
        startDate = lastWeekStart;
        endDate = new Date(lastWeekStart);
        endDate.setDate(lastWeekStart.getDate() + 6);
        break;
      case 'Last 7 Days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        endDate = now;
        break;
      case 'Last 30 Days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        endDate = now;
        break;
      case 'Last 90 Days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 89);
        endDate = now;
        break;
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'Last Year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return timeframeValue;
    }

    const startFormatted = format(startDate, 'MMM dd');
    const endFormatted = format(endDate, 'MMM dd, yyyy');
    return `${timeframeValue} (${startFormatted} – ${endFormatted})`;
  };

  const timeframeText = getDateRangeForTimeframe(data.filters.timeframeType, data.filters.timeframeValue);
  const scopeText = data.filters.gameScope === 'all' ? 'All Games' : 
                   data.filters.gameScope === 'cash' ? 'Cash Games' : 'Tournaments';
  
  doc.text(`Timeframe: ${timeframeText}`, margin, currentY);
  currentY += 6;
  doc.text(`Scope: ${scopeText}`, margin, currentY);
  currentY += 6;
  if (data.userName) {
    doc.text(`User: ${data.userName}`, margin, currentY);
    currentY += 6;
  }
  currentY += 9;
  
  // Thin grey separator line
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 20;
  
  // Statistics Section - Grid Layout (receipt style)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Use the actual stats from the formatted data - no hardcoded field names
  const statsToDisplay = data.stats;
  
  // Grid layout: 2 columns, with labels above values
  const gridCols = 2;
  const colWidth = contentWidth / gridCols;
  const rowHeight = 25;
  
  statsToDisplay.forEach((stat, index) => {
    const col = index % gridCols;
    const row = Math.floor(index / gridCols);
    const x = margin + (col * colWidth);
    const y = currentY + (row * rowHeight);
    
    const { label: kpi, value } = stat;
    
    // Label (top)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text(kpi, x, y);
    
    // Value (below label) with specific styling rules
    doc.setFontSize(11);
    
    // Apply specific styling based on field
    if (kpi === 'Total Payouts') {
      // Total Payouts: green/red based on positive/negative value
      doc.setFont('helvetica', 'bold');
      const firstValue = Array.isArray(value) ? value[0] : value;
      if (firstValue.includes('$') && (firstValue.includes('-') || firstValue.startsWith('-'))) {
        doc.setTextColor(220, 53, 69); // Red for negative payouts
      } else {
        doc.setTextColor(40, 167, 69); // Green for positive payouts
      }
    } else if (kpi === 'Total Buy-ins') {
      // Total Buy-ins: always bold, default color
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 37, 41); // Dark gray
    } else {
      // All other fields: regular styling
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 37, 41); // Dark gray for neutral values
    }
    
    // Handle multi-currency values (array) vs single currency values (string)
    if (Array.isArray(value)) {
      // Multi-currency: display each currency on a new line
      value.forEach((currencyValue, valueIndex) => {
        doc.text(currencyValue, x, y + 8 + (valueIndex * 6)); // 6pt spacing between currency lines
      });
    } else {
      // Single currency: display normally
      doc.text(value, x, y + 8);
    }
  });
  
  // Calculate footer position based on grid height
  const gridRows = Math.ceil(statsToDisplay.length / gridCols);
  const footerY = currentY + (gridRows * rowHeight) + 30;
  
  // Thin grey separator line above footer
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
  
  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy \'at\' HH:mm')}`, pageWidth / 2, footerY - 10, { align: 'center' });
  doc.text('Generated by SessionMaster', pageWidth / 2, footerY, { align: 'center' });
  
  // Generate filename
  const timeframeForFilename = data.filters.timeframeType === 'custom' ? 'Custom' : 
                              data.filters.timeframeValue.replace(/\s+/g, '');
  const scopeForFilename = data.filters.gameScope.charAt(0).toUpperCase() + data.filters.gameScope.slice(1);
  const dateForFilename = format(new Date(), 'yyyy-MM-dd');
  const filename = `MyStatistics_${scopeForFilename}_${timeframeForFilename}_${dateForFilename}.pdf`;
  
  // Save the PDF
  doc.save(filename);
};

// Keep the original function for backward compatibility
export const generateStatisticsPDF = generateStatisticsPDFFromDB;