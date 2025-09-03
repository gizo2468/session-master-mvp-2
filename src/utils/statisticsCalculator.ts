import { supabase } from '@/integrations/supabase/client';
import type { PokerSession } from '@/types/poker';

// Define the SessionFormat type for backwards compatibility
export type SessionFormat = 'all' | 'cash' | 'tournament';

// Enhanced SessionStats interface to match the new unified function
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
  averageBB100: number;
  finalTables: number;
  firstPlaceFinish: number;
}

/**
 * Get default empty statistics
 */
const getDefaultStats = (): SessionStats => ({
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
});

/**
 * Calculate session statistics from database using unified function
 * This ensures data consistency across all components (My Finance, Sessions Stats, PDF Export)
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
      console.error('User not authenticated for statistics calculation');
      throw new Error('User not authenticated');
    }

    console.log('Fetching unified statistics for user:', user.user.id, 'format:', format, 'timeframe:', timeframe, 'currency:', currency);

    // Convert format to database format
    const dbFormat = format === 'all' ? 'all' : format === 'cash' ? 'cash' : 'tournament';

    const { data, error } = await supabase.rpc('get_unified_session_statistics', {
      p_user_id: user.user.id,
      p_format: dbFormat,
      p_timeframe: timeframe,
      p_start_date: startDate?.toISOString(),
      p_end_date: endDate?.toISOString(),
      p_currency: currency && currency !== 'USD' ? currency : null // Only filter if not USD or explicitly specified
    });

    if (error) {
      console.error('Error fetching unified statistics:', error);
      throw error;
    }

    console.log('Raw unified statistics data from DB:', data);

    if (!data || data.length === 0) {
      console.log('No statistics data returned from unified function');
      return getDefaultStats();
    }

    // The new function returns a single row with the requested scope
    const stats = data[0];
    
    const result: SessionStats = {
      netResult: Number(stats.net_result) || 0,
      netHourlyRate: Number(stats.net_hourly_rate) || 0,
      averageNetResult: Number(stats.average_net_result) || 0,
      totalBuyIns: Number(stats.total_buy_ins) || 0,
      totalPayouts: Number(stats.total_payouts) || 0,
      averageDuration: Number(stats.average_duration) || 0,
      totalDuration: Number(stats.total_duration) || 0,
      winRatio: Number(stats.win_ratio) || 0,
      profitLossRatio: Number(stats.profit_loss_ratio) || 0,
      totalTables: Number(stats.total_tables) || 0,
      handsCount: Number(stats.hands_count) || 0,
      numberOfSessions: Number(stats.number_of_sessions) || 0,
      averageBB100: Number(stats.average_bb100) || 0,
      finalTables: Number(stats.final_tables) || 0,
      firstPlaceFinish: Number(stats.first_place_finish) || 0
    };

    console.log('Processed unified statistics:', result);
    return result;

  } catch (error) {
    console.error('Failed to fetch statistics from unified function:', error);
    
    // Fallback to default stats instead of throwing
    return getDefaultStats();
  }
};

/**
 * Filter sessions by format - kept for backwards compatibility with local calculations
 */
export const filterSessionsByFormat = (sessions: PokerSession[], format: SessionFormat): PokerSession[] => {
  if (format === 'all') {
    return sessions;
  }
  
  return sessions.filter(session => {
    const sessionFormat = session.format?.toLowerCase() || '';
    
    if (format === 'cash') {
      return sessionFormat.includes('cash') || sessionFormat.includes('home') || sessionFormat.includes('cg');
    }
    
    if (format === 'tournament') {
      return sessionFormat.includes('tournament') || sessionFormat.includes('mtt');
    }
    
    return false;
  });
};

/**
 * Calculate session statistics from local data - kept for fallback scenarios
 */
export const calculateSessionStatistics = (sessions: PokerSession[], format: SessionFormat = 'all'): SessionStats => {
  const filteredSessions = filterSessionsByFormat(sessions, format).filter(session => 
    session.endTime && session.currentStatus !== 'running'
  );

  if (filteredSessions.length === 0) {
    return getDefaultStats();
  }

  const totalBuyIns = filteredSessions.reduce((sum, session) => 
    sum + (session.buyIn || 0) + (session.rebuyAmount || 0), 0
  );
  
  const totalCashOuts = filteredSessions.reduce((sum, session) => 
    sum + (session.cashOut || 0), 0
  );
  
  const netResult = totalCashOuts - totalBuyIns;
  
  const totalDuration = filteredSessions.reduce((sum, session) => {
    if (!session.startTime || !session.endTime) return sum;
    return sum + (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  const netHourlyRate = totalDuration > 0 ? netResult / totalDuration : 0;
  const averageNetResult = filteredSessions.length > 0 ? netResult / filteredSessions.length : 0;
  const averageDuration = filteredSessions.length > 0 ? totalDuration / filteredSessions.length : 0;
  
  const winningSessions = filteredSessions.filter(session => 
    (session.cashOut || 0) > ((session.buyIn || 0) + (session.rebuyAmount || 0))
  ).length;
  
  const winRatio = filteredSessions.length > 0 ? (winningSessions / filteredSessions.length) * 100 : 0;
  const profitLossRatio = totalBuyIns > 0 ? totalCashOuts / totalBuyIns : 0;
  
  // Estimate total tables (basic calculation)
  const totalTables = filteredSessions.reduce((sum, session) => 
    sum + (session.tablesPlayed || 1), 0
  );

  return {
    netResult,
    netHourlyRate,
    averageNetResult,
    totalBuyIns,
    totalPayouts: totalCashOuts,
    averageDuration,
    totalDuration,
    winRatio,
    profitLossRatio,
    totalTables,
    handsCount: 0, // Not available in local calculation
    numberOfSessions: filteredSessions.length,
    averageBB100: 0, // Not calculated locally
    finalTables: 0, // Not available in local calculation
    firstPlaceFinish: 0, // Not available in local calculation
  };
};

/**
 * Format currency amount with proper symbol
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const getCurrencySymbol = (currencyCode: string): string => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'SEK': 'kr',
      'NZD': 'NZ$',
    };
    return symbols[currencyCode] || currencyCode;
  };

  const symbol = getCurrencySymbol(currency);
  const abs = Math.abs(amount);
  const formatted = abs % 1 === 0 ? abs.toLocaleString() : abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
};

/**
 * Format duration from hours to readable format
 */
export const formatDuration = (hours: number): string => {
  if (hours === 0) return '0m';
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
};

/**
 * Format percentage value
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format ratio as X:1 format
 */
export const formatRatio = (ratio: number): string => {
  return `${ratio.toFixed(1)}:1`;
};