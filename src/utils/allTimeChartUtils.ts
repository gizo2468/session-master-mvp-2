import { PokerSession } from '@/types/poker';
import { calculateSessionProfit } from '@/utils/sessionCalculations';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, startOfYear, endOfYear } from 'date-fns';

interface ChartDataPoint {
  date: string;
  profit: number;
  cumulativeProfit: number;
  sessionCount: number;
}

export const processAllTimeData = (sessions: PokerSession[]): ChartDataPoint[] => {
  if (sessions.length === 0) return [];

  // Create individual data points for each session
  let cumulativeProfit = 0;
  const allTimeData: ChartDataPoint[] = sessions.map(session => {
    const sessionProfit = calculateSessionProfit(session);
    cumulativeProfit += sessionProfit;

    return {
      date: format(new Date(session.startTime), 'yyyy-MM-dd'),
      profit: sessionProfit,
      cumulativeProfit,
      sessionCount: 1
    };
  });

  // Always ensure the chart ends with today's date
  const today = format(new Date(), 'yyyy-MM-dd');
  const lastDataPoint = allTimeData[allTimeData.length - 1];
  
  if (!lastDataPoint || lastDataPoint.date < today) {
    // Add today's date as the final point to extend timeline
    allTimeData.push({
      date: today,
      profit: 0, // No new profit for today if no session
      cumulativeProfit: lastDataPoint ? lastDataPoint.cumulativeProfit : 0,
      sessionCount: 0 // No sessions today if this is just a timeline extension
    });
  }

  return allTimeData;
};

export const processMonthlyData = (sessions: PokerSession[]): ChartDataPoint[] => {
  const currentYear = new Date().getFullYear();
  const yearMonths = eachMonthOfInterval({ 
    start: startOfYear(new Date(currentYear, 0, 1)), 
    end: endOfYear(new Date(currentYear, 11, 31)) 
  });

  const monthlyData: ChartDataPoint[] = yearMonths.map(month => {
    // Find all sessions in this month
    const monthSessions = sessions.filter(session =>
      isSameMonth(new Date(session.startTime), month)
    );

    // Calculate total profit for this month (not cumulative)
    const monthProfit = monthSessions.reduce((total, session) => {
      return total + calculateSessionProfit(session);
    }, 0);

    return {
      date: format(month, 'yyyy-MM-dd'),
      profit: monthProfit,
      cumulativeProfit: monthProfit, // For monthly view, show monthly profit, not cumulative
      sessionCount: monthSessions.length
    };
  });

  return monthlyData;
};