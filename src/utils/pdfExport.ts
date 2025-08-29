import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { FilterOptions } from '@/components/StatisticsFilterModal';
import { calculateSessionStatisticsFromDB, formatCurrency, formatDuration, formatPercentage, formatRatio } from './statisticsCalculator';

interface StatData {
  label: string;
  value: string;
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
    
    // Convert timeframe to backend format
    const timeframe = data.filters.timeframeType === 'custom' ? 'custom' :
                     data.filters.timeframeValue === 'This Month' ? 'this-month' : 'all-time';
    
    const stats = await calculateSessionStatisticsFromDB(
      format,
      timeframe,
      data.filters.customStartDate,
      data.filters.customEndDate
    );

    // Generate PDF with fresh data
    generateStatisticsPDFWithData({
      ...data,
      stats: formatStatsForPDF(stats, data.activeTab)
    });

  } catch (error) {
    console.error('Failed to generate PDF with fresh data:', error);
    // Fallback to provided data
    generateStatisticsPDFWithData(data);
  }
};

const formatStatsForPDF = (stats: any, activeTab: string): StatData[] => {
  const currency = 'USD'; // TODO: get from user preferences
  
  const baseStats = [
    { label: 'Net Result', value: formatCurrency(stats.netResult, currency) },
    { label: 'Net Hourly Rate', value: formatCurrency(stats.netHourlyRate, currency) },
    { label: 'Average Net Result', value: formatCurrency(stats.averageNetResult, currency) },
    { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns, currency) },
    { label: 'Average Duration', value: formatDuration(stats.averageDuration) },
    { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
    { label: 'Total Tables', value: stats.totalTables.toString() },
    { label: 'Number of Sessions', value: stats.numberOfSessions.toString() },
  ];

  if (activeTab === 'sessions') {
    return [
      ...baseStats,
      { label: 'Win Ratio', value: formatPercentage(stats.winRatio) },
      { label: 'Profit/Loss Ratio', value: formatRatio(stats.profitLossRatio) },
    ];
  } else if (activeTab === 'cash') {
    return [
      ...baseStats,
      { label: 'Win Ratio', value: formatPercentage(stats.winRatio) },
      { label: 'Profit/Loss Ratio', value: formatRatio(stats.profitLossRatio) },
      { label: 'Average BB/100', value: stats.averageBB100.toFixed(2) },
      { label: 'Hands Count', value: stats.handsCount.toString() },
    ];
  } else if (activeTab === 'tournaments') {
    return [
      ...baseStats,
      { label: 'Win Ratio', value: formatPercentage(stats.winRatio) },
      { label: 'Profit/Loss Ratio', value: formatRatio(stats.profitLossRatio) },
      { label: 'Final Tables', value: stats.finalTables.toString() },
      { label: 'First Place Finish', value: stats.firstPlaceFinish.toString() },
      { label: 'Hands Count', value: stats.handsCount.toString() },
    ];
  }

  return [
    ...baseStats,
    { label: 'Win Ratio', value: formatPercentage(stats.winRatio) },
    { label: 'Profit/Loss Ratio', value: formatRatio(stats.profitLossRatio) },
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
    
    // Value (below label) with color coding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    
    // Color based on value (green for positive, red for negative)
    if (value.includes('$') && (value.includes('-') || value.startsWith('-'))) {
      doc.setTextColor(220, 53, 69); // Red for negative values
    } else if (value.includes('$') || value.includes('%')) {
      doc.setTextColor(40, 167, 69); // Green for positive values
    } else {
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
  const filename = `MyStatistics_${scopeForFilename}_${timeframeForFilename}_${dateForFilename}.pdf`;
  
  // Save the PDF
  doc.save(filename);
};

// Keep the original function for backward compatibility
export const generateStatisticsPDF = generateStatisticsPDFFromDB;