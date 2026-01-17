import { jsPDF, GState } from 'jspdf';
import { format } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import type { FilterOptions } from '@/components/StatisticsFilterModal';
import {
  formatCurrency,
  formatDuration,
  formatPercentage,
  formatRatio,
} from './statisticsCalculator';

// Import logo as base64
import logoUrl from '@/assets/session-master-logo-pdf.png';

interface StatData {
  label: string;
  value: string;
  rawValue?: number; // For color formatting
  isMoney?: boolean; // To identify money fields
  isCentered?: boolean; // For Total Payouts centering
  isWinRatio?: boolean; // For Win Ratio color logic
  isTotalPayouts?: boolean; // For Total Payouts special styling
}

interface ExportData {
  activeTab: string;
  stats: StatData[];
  filters: FilterOptions;
  userName?: string;
  statistics?: any;
  defaultCurrency?: string;
}

/**
 * Load image as base64 for PDF embedding
 */
const loadImageAsBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * PUBLIC API – what Dashboard imports
 */
export const generateStatisticsPDFFromDB = async (data: ExportData) => {
  console.log('[PDF] Export requested');

  let statsSource: any;

  if (data.statistics) {
    console.log('[PDF] Using filtered statistics from UI');
    switch (data.activeTab) {
      case 'cash':
        statsSource = data.statistics.cash;
        break;
      case 'tournaments':
        statsSource = data.statistics.tournaments;
        break;
      default:
        statsSource = data.statistics.all;
    }
  }

  const formattedStats = statsSource
    ? formatStatsForPDF(statsSource, data.activeTab, data.defaultCurrency || 'USD')
    : data.stats || [];

  await generateStatisticsPDFWithData({
    ...data,
    stats: formattedStats,
  });
};

/**
 * Format money value with +/- sign for PDF display
 */
const formatMoneyWithSign = (value: number, currency: string): string => {
  const absValue = Math.abs(value);
  const formatted = formatCurrency(absValue, currency);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted.replace('-', '')}`;
  return formatted;
};

const formatStatsForPDF = (
  stats: any,
  activeTab: string,
  currency: string
): StatData[] => {
  if (activeTab === 'sessions') {
    return [
      { label: 'Net Result', value: formatMoneyWithSign(stats.netResult ?? 0, currency), rawValue: stats.netResult ?? 0, isMoney: true },
      { label: 'Net Hourly Rate', value: formatMoneyWithSign(stats.netHourlyRate ?? 0, currency), rawValue: stats.netHourlyRate ?? 0, isMoney: true },
      { label: 'Average Net Result', value: formatMoneyWithSign(stats.averageNetResult ?? 0, currency), rawValue: stats.averageNetResult ?? 0, isMoney: true },
      { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns ?? 0, currency), rawValue: stats.totalBuyIns ?? 0, isMoney: false },
      { label: 'Average Duration', value: formatDuration(stats.averageDuration) },
      { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
      { label: 'Win Ratio', value: formatPercentage(stats.winRatio), rawValue: stats.winRatio ?? 0, isWinRatio: true },
      { label: 'Profit/Loss Ratio', value: formatRatio(stats.profitLossRatio) },
      { label: 'Total Tables', value: String(stats.totalTables ?? 0) },
      { label: 'Number of Sessions', value: String(stats.numberOfSessions ?? 0) },
      { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts ?? 0, currency), rawValue: stats.totalPayouts ?? 0, isTotalPayouts: true, isCentered: true },
    ];
  }

  if (activeTab === 'cash') {
    return [
      { label: 'Net Result', value: formatMoneyWithSign(stats.netResult ?? 0, currency), rawValue: stats.netResult ?? 0, isMoney: true },
      { label: 'Net Hourly Rate', value: formatMoneyWithSign(stats.netHourlyRate ?? 0, currency), rawValue: stats.netHourlyRate ?? 0, isMoney: true },
      { label: 'Average BB/100', value: (stats.averageBB100 ?? 0).toFixed(1) },
      { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns ?? 0, currency), rawValue: stats.totalBuyIns ?? 0, isMoney: false },
      { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
      { label: 'Hands Count', value: (stats.handsCount ?? 0).toLocaleString() },
      { label: 'Number of Sessions', value: String(stats.numberOfSessions ?? 0) },
      { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts ?? 0, currency), rawValue: stats.totalPayouts ?? 0, isTotalPayouts: true, isCentered: true },
    ];
  }

  return [
    { label: 'Net Result', value: formatMoneyWithSign(stats.netResult ?? 0, currency), rawValue: stats.netResult ?? 0, isMoney: true },
    { label: 'Net Hourly Rate', value: formatMoneyWithSign(stats.netHourlyRate ?? 0, currency), rawValue: stats.netHourlyRate ?? 0, isMoney: true },
    { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns ?? 0, currency), rawValue: stats.totalBuyIns ?? 0, isMoney: false },
    { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
    { label: 'Final Tables', value: String(stats.finalTables ?? 0) },
    { label: 'First Place Finish', value: String(stats.firstPlaceFinish ?? 0) },
    { label: 'Hands Count', value: (stats.handsCount ?? 0).toLocaleString() },
    { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts ?? 0, currency), rawValue: stats.totalPayouts ?? 0, isTotalPayouts: true, isCentered: true },
  ];
};

/**
 * CORE PDF GENERATION + SHARE (iOS)
 */
const generateStatisticsPDFWithData = async (data: ExportData) => {
  console.log('[PDF] generateStatisticsPDFWithData started');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // === TITLE (centered, bold, larger) ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('My Finance', pageWidth / 2, y, { align: 'center' });
  y += 30;

  // === HEADER INFO (centered) ===
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Timeframe: ${data.filters.timeframeValue}`, pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.text(`Scope: ${data.filters.gameScope}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  if (data.userName) {
    doc.text(`User: ${data.userName}`, pageWidth / 2, y, { align: 'center' });
    y += 8;
  }

  y += 12;

  // === 2-COLUMN STATS (centered, compact) ===
  const colWidth = 70;
  const colGap = 20;
  const totalBlockWidth = colWidth * 2 + colGap;
  const blockStartX = (pageWidth - totalBlockWidth) / 2;
  const rowHeight = 22;

  // Separate regular stats from centered stats (Total Payouts)
  const regularStats = data.stats.filter(s => !s.isCentered);
  const centeredStats = data.stats.filter(s => s.isCentered);

  let currentRow = 0;
  regularStats.forEach((s, i) => {
    const col = i % 2;
    currentRow = Math.floor(i / 2);
    const colCenterX = blockStartX + col * (colWidth + colGap) + colWidth / 2;
    const yy = y + currentRow * rowHeight;

    // Label: bold, centered in column
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(s.label, colCenterX, yy, { align: 'center' });

    // Underline the label (centered)
    const labelWidth = doc.getTextWidth(s.label);
    doc.setLineWidth(0.4);
    doc.setDrawColor(0, 0, 0);
    doc.line(colCenterX - labelWidth / 2, yy + 1.5, colCenterX + labelWidth / 2, yy + 1.5);

    // Value below the label with color for money values
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Set color based on value type
    if (s.isMoney && s.rawValue !== undefined) {
      if (s.rawValue > 0) {
        doc.setTextColor(34, 139, 34); // Green
      } else if (s.rawValue < 0) {
        doc.setTextColor(220, 53, 69); // Red
      } else {
        doc.setTextColor(0, 0, 0); // Black for zero
      }
    } else if (s.isWinRatio && s.rawValue !== undefined) {
      // Win Ratio: green if > 0, red if = 0
      if (s.rawValue > 0) {
        doc.setTextColor(34, 139, 34); // Green
      } else {
        doc.setTextColor(220, 53, 69); // Red
      }
    } else {
      doc.setTextColor(0, 0, 0); // Black for non-money values
    }
    
    doc.text(s.value, colCenterX, yy + 10, { align: 'center' });
  });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Calculate Y position after regular stats
  const statsEndY = y + (currentRow + 1) * rowHeight + 5;

  // Draw centered stats (Total Payouts) between columns
  centeredStats.forEach((s, i) => {
    const centerX = pageWidth / 2;
    const yy = statsEndY + i * rowHeight;

    // Label: bold, centered on page
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(s.label, centerX, yy, { align: 'center' });

    // Underline the label
    const labelWidth = doc.getTextWidth(s.label);
    doc.setLineWidth(0.4);
    doc.setDrawColor(0, 0, 0);
    doc.line(centerX - labelWidth / 2, yy + 1.5, centerX + labelWidth / 2, yy + 1.5);

    // Value with special styling for Total Payouts
    doc.setFontSize(12);
    
    if (s.isTotalPayouts && s.rawValue !== undefined) {
      if (s.rawValue > 0) {
        // Gold with bold for positive Total Payouts
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(218, 165, 32); // Gold color
        
        // Draw glow effect (multiple layers of gold text with slight offsets)
        const glowColor = [255, 215, 0]; // Bright gold for glow
        const gState = new GState({ opacity: 0.3 });
        doc.saveGraphicsState();
        doc.setGState(gState);
        doc.setTextColor(glowColor[0], glowColor[1], glowColor[2]);
        // Draw glow layers
        doc.text(s.value, centerX - 0.5, yy + 10, { align: 'center' });
        doc.text(s.value, centerX + 0.5, yy + 10, { align: 'center' });
        doc.text(s.value, centerX, yy + 9.5, { align: 'center' });
        doc.text(s.value, centerX, yy + 10.5, { align: 'center' });
        doc.restoreGraphicsState();
        
        // Draw main gold text on top
        doc.setTextColor(218, 165, 32); // Gold color
        doc.text(s.value, centerX, yy + 10, { align: 'center' });
      } else {
        // Red for zero Total Payouts
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(220, 53, 69); // Red
        doc.text(s.value, centerX, yy + 10, { align: 'center' });
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(s.value, centerX, yy + 10, { align: 'center' });
    }
  });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // === LOGO AT BOTTOM CENTER (clean, no glow) ===
  try {
    const logoBase64 = await loadImageAsBase64(logoUrl);
    const logoWidth = 70;
    const logoHeight = 48;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = pageHeight - logoHeight - 20;

    // Draw the logo (clean, no effects)
    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    
    console.log('[PDF] Logo added successfully');
  } catch (err) {
    console.error('[PDF] Failed to load logo:', err);
  }

  const filename = `MyFinance_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  const platform = Capacitor.getPlatform();

  // WEB fallback
  if (platform === 'web') {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // iOS/Android (Capacitor)
  try {
    console.log('[PDF] Platform:', platform);

    const dataUri = doc.output('datauristring');
    const base64 = dataUri.split(',')[1];
    console.log('[PDF] base64 length:', base64?.length);

    const writeRes = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });

    console.log('[PDF] writeFile result:', writeRes);

    const fileUri = (writeRes as any).uri;
    console.log('[PDF] fileUri:', fileUri);

    await Share.share({
      title: filename,
      text: 'My Finance export',
      url: fileUri,
    });

    console.log('[PDF] Share sheet invoked');
  } catch (err) {
    console.error('[PDF] Export failed:', err);
    alert('PDF export failed. Check Xcode logs for details.');
  }
};

// what Dashboard imports
export const generateStatisticsPDF = generateStatisticsPDFFromDB;
