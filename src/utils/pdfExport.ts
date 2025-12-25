import { jsPDF } from 'jspdf';
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

interface StatData {
  label: string;
  value: string;
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

const formatStatsForPDF = (
  stats: any,
  activeTab: string,
  currency: string
): StatData[] => {
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
      { label: 'Total Tables', value: String(stats.totalTables ?? 0) },
      { label: 'Number of Sessions', value: String(stats.numberOfSessions ?? 0) },
      { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts, currency) },
    ];
  }

  if (activeTab === 'cash') {
    return [
      { label: 'Net Result', value: formatCurrency(stats.netResult, currency) },
      { label: 'Net Hourly Rate', value: formatCurrency(stats.netHourlyRate, currency) },
      { label: 'Average BB/100', value: (stats.averageBB100 ?? 0).toFixed(1) },
      { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns, currency) },
      { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
      { label: 'Hands Count', value: (stats.handsCount ?? 0).toLocaleString() },
      { label: 'Number of Sessions', value: String(stats.numberOfSessions ?? 0) },
      { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts, currency) },
    ];
  }

  return [
    { label: 'Net Result', value: formatCurrency(stats.netResult, currency) },
    { label: 'Net Hourly Rate', value: formatCurrency(stats.netHourlyRate, currency) },
    { label: 'Total Buy-ins', value: formatCurrency(stats.totalBuyIns, currency) },
    { label: 'Total Duration', value: formatDuration(stats.totalDuration) },
    { label: 'Final Tables', value: String(stats.finalTables ?? 0) },
    { label: 'First Place Finish', value: String(stats.firstPlaceFinish ?? 0) },
    { label: 'Hands Count', value: (stats.handsCount ?? 0).toLocaleString() },
    { label: 'Total Payouts', value: formatCurrency(stats.totalPayouts, currency) },
  ];
};

/**
 * CORE PDF GENERATION + SHARE (iOS)
 */
const generateStatisticsPDFWithData = async (data: ExportData) => {
  console.log('[PDF] generateStatisticsPDFWithData started');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('My Finance', pageWidth / 2, y, { align: 'center' });
  y += 20;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  doc.text(`Timeframe: ${data.filters.timeframeValue}`, margin, y);
  y += 6;
  doc.text(`Scope: ${data.filters.gameScope}`, margin, y);
  y += 6;

  if (data.userName) {
    doc.text(`User: ${data.userName}`, margin, y);
    y += 6;
  }

  y += 10;

  const colWidth = (pageWidth - margin * 2) / 2;
  const rowHeight = 22;

  data.stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * colWidth;
    const yy = y + row * rowHeight;

    doc.setFontSize(9);
    doc.text(s.label, x, yy);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(s.value, x, yy + 8);
  });

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

    const dataUri = doc.output('datauristring'); // data:application/pdf;base64,...
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