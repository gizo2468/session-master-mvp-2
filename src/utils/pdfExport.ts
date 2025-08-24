import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { FilterOptions } from '@/components/StatisticsFilterModal';

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

export const generateStatisticsPDF = (data: ExportData) => {
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
  
  // Define KPIs in the specific order requested
  const requiredKPIs = [
    'Net Result',
    'Net Hourly Rate', 
    'Average Net Result',
    'Number of Sessions',
    'Average Duration',
    'Duration of Play',
    'Total Tables',
    'Overall Buy-ins', // Placeholder for now
    'Total Payouts'    // Placeholder for now
  ];
  
  // Create a map of existing stats for easy lookup
  const statsMap = new Map(data.stats.map(stat => [stat.label, stat.value]));
  
  // Add placeholder values for new KPIs if not present
  requiredKPIs.forEach(kpi => {
    if (!statsMap.has(kpi)) {
      if (kpi === 'Overall Buy-ins') {
        statsMap.set(kpi, '$2,450');
      } else if (kpi === 'Total Payouts') {
        statsMap.set(kpi, '$2,680');
      }
    }
  });
  
  // Grid layout: 2 columns, with labels above values
  const gridCols = 2;
  const colWidth = contentWidth / gridCols;
  const rowHeight = 25;
  
  requiredKPIs.forEach((kpi, index) => {
    const col = index % gridCols;
    const row = Math.floor(index / gridCols);
    const x = margin + (col * colWidth);
    const y = currentY + (row * rowHeight);
    
    const value = statsMap.get(kpi) || 'N/A';
    
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
  const gridRows = Math.ceil(requiredKPIs.length / gridCols);
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