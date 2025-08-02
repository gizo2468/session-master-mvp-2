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
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Generate all days of current month up to today (or last day if we're past it)
  const endDate = today > lastDayOfMonth ? lastDayOfMonth : today;
  const daysInCurrentMonth = [];
  
  for (let day = new Date(currentMonth); day <= endDate; day.setDate(day.getDate() + 1)) {
    daysInCurrentMonth.push(new Date(day));
  }
  
  // Calculate cumulative profit from all sessions before current month
  const sessionsBeforeCurrentMonth = sessions.filter(session => 
    new Date(session.startTime) < currentMonth
  );
  
  let cumulativeProfitFromPreviousMonths = 0;
  sessionsBeforeCurrentMonth.forEach(session => {
    cumulativeProfitFromPreviousMonths += calculateSessionProfit(session);
  });
  
  // Create data points for each day in current month
  let runningCumulative = cumulativeProfitFromPreviousMonths;
  
  const allTimeData: ChartDataPoint[] = daysInCurrentMonth.map(day => {
    const dayString = format(day, 'yyyy-MM-dd');
    
    // Find sessions on this specific day
    const sessionsOnDay = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return (
        sessionDate.getFullYear() === day.getFullYear() &&
        sessionDate.getMonth() === day.getMonth() &&
        sessionDate.getDate() === day.getDate()
      );
    });
    
    // Calculate profit for this day
    const dayProfit = sessionsOnDay.reduce((total, session) => {
      return total + calculateSessionProfit(session);
    }, 0);
    
    // Update running cumulative
    runningCumulative += dayProfit;
    
    return {
      date: dayString,
      profit: dayProfit,
      cumulativeProfit: runningCumulative,
      sessionCount: sessionsOnDay.length
    };
  });

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

export const processDailyData = (sessions: PokerSession[]): ChartDataPoint[] => {
  const today = new Date();
  const weekDays = [];
  
  // Generate last 7 days
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    weekDays.push(day);
  }

  const dailyData: ChartDataPoint[] = weekDays.map(day => {
    // Find all sessions on this day
    const daySessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return (
        sessionDate.getFullYear() === day.getFullYear() &&
        sessionDate.getMonth() === day.getMonth() &&
        sessionDate.getDate() === day.getDate()
      );
    });

    // Calculate total profit for this day
    const dayProfit = daySessions.reduce((total, session) => {
      return total + calculateSessionProfit(session);
    }, 0);

    return {
      date: format(day, 'yyyy-MM-dd'),
      profit: dayProfit,
      cumulativeProfit: dayProfit, // For daily view, show daily profit, not cumulative
      sessionCount: daySessions.length
    };
  });

  return dailyData;
};

export const processWeeklyData = (sessions: PokerSession[]): ChartDataPoint[] => {
  const today = new Date();
  const weeks = [];
  
  // Generate last 12 weeks (Monday to Sunday)
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(today);
    const daysToMonday = (weekStart.getDay() + 6) % 7; // Get days since Monday
    weekStart.setDate(weekStart.getDate() - daysToMonday - (i * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    weeks.push({ start: weekStart, end: weekEnd });
  }

  const weeklyData: ChartDataPoint[] = weeks.map((week, index) => {
    // Find all sessions in this week
    const weekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= week.start && sessionDate <= week.end;
    });

    // Calculate total profit for this week
    const weekProfit = weekSessions.reduce((total, session) => {
      return total + calculateSessionProfit(session);
    }, 0);

    return {
      date: `WEEK ${index + 1}`,
      profit: weekProfit,
      cumulativeProfit: weekProfit, // For weekly view, show weekly profit, not cumulative
      sessionCount: weekSessions.length
    };
  });

  return weeklyData;
};