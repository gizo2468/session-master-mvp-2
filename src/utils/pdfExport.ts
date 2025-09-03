import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { FilterOptions } from '@/components/StatisticsFilterModal';
import { calculateSessionStatisticsFromDB, formatCurrency, formatDuration, formatPercentage, formatRatio } from './statisticsCalculator';
import { supabase } from '@/integrations/supabase/client';

interface StatData {
  label: string;
  value: string;
}

interface ExportData {
  activeTab: string;
  stats: StatData[];
  filters: FilterOptions;
  userName?: string;
  statisticsData?: any;
  defaultCurrency?: string;
}

export const generateStatisticsPDFFromDB = async (data: ExportData) => {
  try {
    // Use the unified statistics function with proper format mapping
    const formatMap = { 
      sessions: 'all', 
      cash: 'cash', 
      tournaments: 'tournament' 
    } as const;
    
    const dbFormat = formatMap[data.activeTab as keyof typeof formatMap] || 'all';
    
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
    
    const stats = await calculateSessionStatisticsFromDB(
      dbFormat,
      timeframe,
      startDate,
      endDate,
      null // Remove currency filtering for broader data access
    );

    // Calculate best session result using the same filtering logic
    const bestSessionResult = await calculateBestSessionResult(dbFormat, startDate, endDate);

    // Generate PDF with fresh data
    generateStatisticsPDFWithData({
      ...data,
      stats: formatStatsForPDF(stats, data.activeTab, bestSessionResult, data.defaultCurrency || 'USD')
    });

  } catch (error) {
    console.error('Failed to generate PDF with fresh data:', error);
    // Fallback to provided data
    generateStatisticsPDFWithData(data);
  }
};

const calculateBestSessionResult = async (format: string, startDate?: Date, endDate?: Date): Promise<number> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return 0;

    let query = supabase
      .from('sessions')
      .select('cash_out, buy_in, rebuy_amount')
      .eq('user_id', user.user.id)
      .not('end_time', 'is', null); // Only completed sessions

    // Apply format filter with proper mapping
    if (format === 'cash') {
      query = query.ilike('format', '%cash%');
    } else if (format === 'tournament') {
      query = query.ilike('format', '%tournament%');
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

    // Calculate the best (highest) session result including rebuys
    const sessionResults = sessions.map(session => 
      (session.cash_out || 0) - ((session.buy_in || 0) + (session.rebuy_amount || 0))
    );

    return Math.max(...sessionResults);
  } catch (error) {
    console.error('Error calculating best session result:', error);
    return 0;
  }
};

const formatStatsForPDF = (stats: any, activeTab: string, bestSessionResult: number, currency: string = 'USD'): StatData[] => {
  
  // Base stats without the removed fields (Average Net Result, Average Duration, Profit/Loss Ratio)
  const baseStats = [
    { label: 'Net Result', value: formatCurrency(stats.netResult, currency) },
    { label: 'Net Hourly Rate', value: formatCurrency(stats.netHourlyRate, currency) },
    { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns, currency) },
    { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
    { label: 'Total Tables', value: stats.totalTables.toString() },
    { label: 'Number of Sessions', value: stats.numberOfSessions.toString() },
    { label: 'Best Session Result', value: formatCurrency(bestSessionResult, currency) },
  ];

  if (activeTab === 'sessions') {
    return [
      { label: 'Net Result', value: formatCurrency(stats.netResult, currency) },
      { label: 'Net Hourly Rate', value: formatCurrency(stats.netHourlyRate, currency) },
      { label: 'Average Net Result', value: formatCurrency(stats.averageNetResult, currency) },
      { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns, currency) },
      { label: 'Average Duration', value: formatDuration(stats.averageDuration) },
      { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
      { label: 'Win Ratio', value: formatPercentage(stats.winRatio) },
      { label: 'Profit/Loss Ratio', value: formatRatio(stats.profitLossRatio) },
      { label: 'Total Tables', value: stats.totalTables.toString() },
      { label: 'Number of Sessions', value: stats.numberOfSessions.toString() },
      { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts, currency) },
    ];
  } else if (activeTab === 'cash') {
    return [
      { label: 'Net Result', value: formatCurrency(stats.netResult, currency) },
      { label: 'Net Hourly Rate', value: formatCurrency(stats.netHourlyRate, currency) },
      { label: 'Average Net Result', value: formatCurrency(stats.averageNetResult, currency) },
      { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns, currency) },
      { label: 'Average Duration', value: formatDuration(stats.averageDuration) },
      { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
      { label: 'Average BB/100', value: stats.averageBB100?.toFixed(1) || '0.0' },
      { label: 'Profit/Loss Ratio', value: formatRatio(stats.profitLossRatio) },
      { label: 'Total Tables', value: stats.totalTables.toString() },
      { label: 'Hands Count', value: stats.handsCount.toLocaleString() },
      { label: 'Number of Sessions', value: stats.numberOfSessions.toString() },
      { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts, currency) },
    ];
  } else if (activeTab === 'tournaments') {
    return [
      { label: 'Net Result', value: formatCurrency(stats.netResult, currency) },
      { label: 'Net Hourly Rate', value: formatCurrency(stats.netHourlyRate, currency) },
      { label: 'Average Net Result', value: formatCurrency(stats.averageNetResult, currency) },
      { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns, currency) },
      { label: 'Average Duration', value: formatDuration(stats.averageDuration) },
      { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
      { label: 'Final Tables', value: stats.finalTables?.toString() || '0' },
      { label: 'First Place Finish', value: stats.firstPlaceFinish?.toString() || '0' },
      { label: 'Total Tables', value: stats.totalTables.toString() },
      { label: 'Hands Count', value: stats.handsCount.toLocaleString() },
      { label: 'Number of Sessions', value: stats.numberOfSessions.toString() },
      { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts, currency) },
    ];
  }

  return [
    { label: 'Net Result', value: formatCurrency(stats.netResult, currency) },
    { label: 'Net Hourly Rate', value: formatCurrency(stats.netHourlyRate, currency) },
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
  
  // My Finance Title (olive-green color)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(85, 107, 47); // Olive green color
  doc.text('My Finance', pageWidth / 2, currentY, { align: 'center' });
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
      if (value.includes('$') && (value.includes('-') || value.startsWith('-'))) {
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
    
    doc.text(value, x, y + 8);
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
  const filename = `MyFinance_${scopeForFilename}_${timeframeForFilename}_${dateForFilename}.pdf`;
  
  // Save the PDF
  doc.save(filename);
};

// Keep the original function for backward compatibility
export const generateStatisticsPDF = generateStatisticsPDFFromDB;