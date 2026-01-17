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

// Logo path for PDF branding
const LOGO_PATH = '/lovable-uploads/9dacd61d-619a-4834-8789-3d9484fc67a0.png';

// Cache for logo base64 to avoid re-fetching
let cachedLogoBase64: string | null = null;

/**
 * Convert logo image to base64 for PDF embedding
 */
const getLogoBase64 = async (): Promise<string | null> => {
  if (cachedLogoBase64) {
    return cachedLogoBase64;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          cachedLogoBase64 = canvas.toDataURL('image/png');
          resolve(cachedLogoBase64);
        } else {
          resolve(null);
        }
      } catch (err) {
        console.warn('[PDF] Canvas conversion failed:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('[PDF] Logo load failed');
      resolve(null);
    };
    img.src = LOGO_PATH;
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
 * Updated layout: centered content, styled headings, logo at bottom
 */
const generateStatisticsPDFWithData = async (data: ExportData) => {
  console.log('[PDF] generateStatisticsPDFWithData started');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  let y = 25;

  // ===== TITLE =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('My Finance', centerX, y, { align: 'center' });
  y += 15;

  // ===== FILTERS INFO (centered) =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  doc.text(`Timeframe: ${data.filters.timeframeValue}`, centerX, y, { align: 'center' });
  y += 7;
  doc.text(`Scope: ${data.filters.gameScope}`, centerX, y, { align: 'center' });
  y += 7;

  if (data.userName) {
    doc.text(`User: ${data.userName}`, centerX, y, { align: 'center' });
    y += 7;
  }

  // Reset text color
  doc.setTextColor(0, 0, 0);
  y += 12;

  // ===== STATS (centered, single column with styled headings) =====
  const rowHeight = 22; // Space for label + value + gap

  data.stats.forEach((s, i) => {
    const yy = y + i * rowHeight;

    // Label: bold, larger, underlined
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(s.label, centerX, yy, { align: 'center' });

    // Draw underline below label
    const labelWidth = doc.getTextWidth(s.label);
    const underlineY = yy + 1.5;
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.4);
    doc.line(
      centerX - labelWidth / 2,
      underlineY,
      centerX + labelWidth / 2,
      underlineY
    );

    // Value: normal weight, below label
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(s.value, centerX, yy + 9, { align: 'center' });
  });

  // ===== LOGO AT BOTTOM CENTER =====
  try {
    const logoBase64 = await getLogoBase64();
    if (logoBase64) {
      const logoWidth = 35;
      const logoHeight = 35;
      const logoX = centerX - logoWidth / 2;
      const logoY = pageHeight - logoHeight - 20; // 20mm from bottom

      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
      console.log('[PDF] Logo added successfully');
    }
  } catch (err) {
    console.warn('[PDF] Could not add logo:', err);
  }

  // ===== SAVE / SHARE =====
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
