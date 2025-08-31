import { PokerSession } from "@/types/poker";
import { calculateSessionProfit } from "./sessionCalculations";
import { supabase } from "@/integrations/supabase/client";

export type SessionFormat = 'all' | 'cash' | 'tournament';

export interface SessionStats {
  netResult: number;
  netHourlyRate: number;
  averageNetResult: number;
  totalBuyIns: number;
  totalPayouts: number;
  averageDuration: number;
  totalDuration: number;
  winRatio: number;
  profitLossRatio: number;
  totalTables: number;
  handsCount: number;
  numberOfSessions: number;
  // Cash-specific
  averageBB100?: number;
  // Tournament-specific
  finalTables?: number;
  firstPlaceFinish?: number;
}

/**
 * Calculate statistics using Supabase backend function with currency filtering
 */
export const calculateSessionStatisticsFromDB = async (
  format: SessionFormat, 
  timeframe: string = 'all-time',
  startDate?: Date,
  endDate?: Date,
  currency?: string
): Promise<SessionStats> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('Fetching statistics for user:', user.user.id, 'format:', format, 'timeframe:', timeframe, 'currency:', currency);

    const { data, error } = await supabase.rpc('get_user_session_statistics', {
      p_user_id: user.user.id,
      p_timeframe: timeframe,
      p_start_date: startDate?.toISOString(),
      p_end_date: endDate?.toISOString(),
      p_currency: currency // Add currency filter to database call
    });

    if (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }

    console.log('Raw statistics data from DB:', data);

    // Find the stats for the requested format
    const scopeMap: Record<SessionFormat, string> = {
      'all': 'all',
      'cash': 'cash',
      'tournament': 'tournaments'
    };

    const stats = data?.find((row: any) => row.scope === scopeMap[format]);
    
    console.log('Stats for format', format, ':', stats);
    
    if (!stats) {
      console.log('No stats found for format:', format, 'returning defaults');
      // Return default values if no data found
      return {
        netResult: 0,
        netHourlyRate: 0,
        averageNetResult: 0,
        totalBuyIns: 0,
        totalPayouts: 0,
        averageDuration: 0,
        totalDuration: 0,
        winRatio: 0,
        profitLossRatio: 0,
        totalTables: 0,
        handsCount: 0,
        numberOfSessions: 0,
        averageBB100: 0,
        finalTables: 0,
        firstPlaceFinish: 0,
      };
    }

    const result = {
      netResult: Number(stats.net_result || 0),
      netHourlyRate: Number(stats.net_hourly_rate || 0),
      averageNetResult: Number(stats.average_net_result || 0),
      totalBuyIns: Number(stats.total_buy_ins || 0),
      totalPayouts: Number(stats.total_payouts || 0),
      averageDuration: Number(stats.average_duration || 0),
      totalDuration: Number(stats.total_duration || 0),
      winRatio: Number(stats.win_ratio || 0),
      profitLossRatio: Number(stats.profit_loss_ratio || 0),
      totalTables: Number(stats.total_tables || 0),
      handsCount: Number(stats.hands_count || 0),
      numberOfSessions: Number(stats.number_of_sessions || 0),
      averageBB100: Number(stats.average_bb100 || 0),
      finalTables: Number(stats.final_tables || 0),
      firstPlaceFinish: Number(stats.first_place_finish || 0),
    };

    console.log('Processed statistics result:', result);
    return result;
  } catch (error) {
    console.error('Failed to calculate statistics from DB:', error);
    // Fallback to local calculation if DB fails
    return {
      netResult: 0,
      netHourlyRate: 0,
      averageNetResult: 0,
      totalBuyIns: 0,
      totalPayouts: 0,
      averageDuration: 0,
      totalDuration: 0,
      winRatio: 0,
      profitLossRatio: 0,
      totalTables: 0,
      handsCount: 0,
      numberOfSessions: 0,
      averageBB100: 0,
      finalTables: 0,
      firstPlaceFinish: 0,
    };
  }
}

/**
 * Filter sessions based on format
 */
export const filterSessionsByFormat = (sessions: PokerSession[], format: SessionFormat): PokerSession[] => {
  if (format === 'all') return sessions;
  
  return sessions.filter(session => {
    const sessionFormat = session.format?.toLowerCase() || '';
    
    if (format === 'cash') {
      return sessionFormat.includes('cash') || sessionFormat.includes('home');
    }
    
    if (format === 'tournament') {
      return sessionFormat.includes('tournament');
    }
    
    return false;
  });
};

/**
 * Calculate comprehensive statistics for sessions
 */
export const calculateSessionStatistics = (sessions: PokerSession[], format: SessionFormat): SessionStats => {
  // Filter sessions based on format and exclude active sessions
  const completedSessions = filterSessionsByFormat(sessions, format)
    .filter(s => !s.isActive && (s.currentStatus === 'ended' || s.status === 'completed' || !s.status));
  
  const numberOfSessions = completedSessions.length;
  
  if (numberOfSessions === 0) {
    return {
      netResult: 0,
      netHourlyRate: 0,
      averageNetResult: 0,
      totalBuyIns: 0,
      totalPayouts: 0,
      averageDuration: 0,
      totalDuration: 0,
      winRatio: 0,
      profitLossRatio: 0,
      totalTables: 0,
      handsCount: 0,
      numberOfSessions: 0,
      averageBB100: 0,
      finalTables: 0,
      firstPlaceFinish: 0,
    };
  }

  // Calculate net result
  const netResult = completedSessions.reduce((sum, session) => sum + calculateSessionProfit(session), 0);
  
  // Calculate total buy-ins
  const totalBuyIns = completedSessions.reduce((sum, session) => {
    if (session.tables && session.tables.length > 0) {
      return sum + session.tables.reduce((tableSum, table) => {
        const buyIn = table.buyIn || 0;
        const rebuys = table.rebuyAmount || 0;
        return tableSum + buyIn + rebuys;
      }, 0);
    }
    const buyIn = session.buyIn || 0;
    const rebuys = session.rebuyAmount || 0;
    return sum + buyIn + rebuys;
  }, 0);

  // Calculate total tables
  const totalTables = completedSessions.reduce((sum, session) => {
    if (session.tables && session.tables.length > 0) {
      return sum + session.tables.length;
    }
    if (session.tablesPlayed && session.tablesPlayed > 0) {
      return sum + session.tablesPlayed;
    }
    return sum + 1; // Default to 1 table per session
  }, 0);

  // Calculate hands count
  const handsCount = completedSessions.reduce((total, session) => {
    let sessionHands = (session.hands?.length || 0);
    
    // Add hands from tables
    if (session.tables) {
      sessionHands += session.tables.reduce((tableTotal, table) => {
        return tableTotal + (table.hands?.length || 0);
      }, 0);
    }
    
    return total + sessionHands;
  }, 0);

  // Calculate duration statistics
  const sessionsWithDuration = completedSessions.filter(s => 
    s.startTime && s.endTime && s.endTime > s.startTime
  );
  
  const totalDurationMs = sessionsWithDuration.reduce((total, session) => {
    const duration = session.endTime!.getTime() - session.startTime.getTime();
    return total + duration;
  }, 0);
  
  const totalDuration = totalDurationMs / (1000 * 60 * 60); // Convert to hours
  const averageDuration = sessionsWithDuration.length > 0 ? totalDuration / sessionsWithDuration.length : 0;

  // Calculate net hourly rate
  const netHourlyRate = totalDuration > 0 ? netResult / totalDuration : 0;

  // Calculate average net result
  const averageNetResult = numberOfSessions > 0 ? netResult / numberOfSessions : 0;

  // Calculate win ratio
  const wins = completedSessions.filter(s => calculateSessionProfit(s) > 0).length;
  const winRatio = numberOfSessions > 0 ? (wins / numberOfSessions) * 100 : 0;

  // Calculate profit/loss ratio
  const profits = completedSessions.filter(s => calculateSessionProfit(s) > 0);
  const losses = completedSessions.filter(s => calculateSessionProfit(s) < 0);
  
  const totalProfits = profits.reduce((sum, s) => sum + calculateSessionProfit(s), 0);
  const totalLosses = Math.abs(losses.reduce((sum, s) => sum + calculateSessionProfit(s), 0));
  
  const profitLossRatio = totalLosses > 0 ? totalProfits / totalLosses : totalProfits > 0 ? 999 : 0;

  // Cash-specific: Calculate Average BB/100
  let averageBB100 = 0;
  if (format === 'cash' && handsCount > 0) {
    const totalBigBlinds = completedSessions.reduce((sum, session) => {
      const bigBlind = session.bigBlind || 1;
      const profit = calculateSessionProfit(session);
      return sum + (profit / bigBlind);
    }, 0);
    averageBB100 = (totalBigBlinds / handsCount) * 100;
  }

  // Tournament-specific statistics
  let finalTables = 0;
  let firstPlaceFinish = 0;
  
  if (format === 'tournament') {
    finalTables = completedSessions.reduce((count, session) => {
      if (session.tables && session.tables.length > 0) {
        return count + session.tables.filter(table => 
          table.finalPosition && table.finalPosition <= 9 // Assuming final table is top 9
        ).length;
      }
      // Check session-level final position if available
      return count;
    }, 0);

    firstPlaceFinish = completedSessions.reduce((count, session) => {
      if (session.tables && session.tables.length > 0) {
        return count + session.tables.filter(table => 
          table.finalPosition === 1
        ).length;
      }
      // Check session-level final position if available
      return count;
    }, 0);
  }

  // Calculate total payouts (cashouts)
  const totalPayouts = completedSessions.reduce((sum, session) => {
    if (session.tables && session.tables.length > 0) {
      return sum + session.tables.reduce((tableSum, table) => {
        return tableSum + (table.cashOut || 0);
      }, 0);
    }
    return sum + (session.cashOut || 0);
  }, 0);

  return {
    netResult,
    netHourlyRate,
    averageNetResult,
    totalBuyIns,
    totalPayouts,
    averageDuration,
    totalDuration,
    winRatio,
    profitLossRatio,
    totalTables,
    handsCount,
    numberOfSessions,
    averageBB100,
    finalTables,
    firstPlaceFinish,
  };
};

/**
 * Format currency display - now uses the centralized currency symbols from useDefaultCurrency
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  // Import getCurrencySymbol function to avoid duplication
  const { getCurrencySymbol } = require('@/hooks/useDefaultCurrency');
  
  const symbol = getCurrencySymbol(currency);
  const abs = Math.abs(amount);
  const formatted = abs % 1 === 0 ? abs.toLocaleString() : abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

/**
 * Format duration in hours
 */
export const formatDuration = (hours: number): string => {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  return `${hours.toFixed(1)}h`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format ratio (e.g., 2.5:1)
 */
export const formatRatio = (ratio: number): string => {
  if (ratio === 0) return '0:1';
  if (ratio >= 999) return '∞:1';
  return `${ratio.toFixed(1)}:1`;
};