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

export const processWeeklyData = (sessions: PokerSession[]): ChartDataPoint[] => {
  const today = new Date();
  const weekDays = [];
  
  // Generate last 7 days
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    weekDays.push(day);
  }

  // Filter sessions to only include completed sessions from the last 7 days
  const completedSessions = sessions.filter(session => 
    !session.isActive && session.endTime
  );

  const weeklyData: ChartDataPoint[] = weekDays.map(day => {
    // Find all sessions on this day
    const daySessions = completedSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return (
        sessionDate.getFullYear() === day.getFullYear() &&
        sessionDate.getMonth() === day.getMonth() &&
        sessionDate.getDate() === day.getDate()
      );
    });

    // Calculate total profit/loss for this day (includes both wins and losses)
    const dayProfit = daySessions.reduce((total, session) => {
      return total + calculateSessionProfit(session);
    }, 0);

    return {
      date: format(day, 'yyyy-MM-dd'),
      profit: dayProfit,
      cumulativeProfit: dayProfit, // For weekly view, show daily profit/loss, not cumulative
      sessionCount: daySessions.length
    };
  });

  return weeklyData;
};