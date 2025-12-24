import { PokerSession } from "@/types/poker";

/**
 * Calculate the net profit/loss for a poker session
 * Handles both table-level and session-level data structures
 */
export const calculateSessionProfit = (session: PokerSession): number => {
  // If session has tables, calculate from table-level data
  if (session.tables && session.tables.length > 0) {
    const completedTables = session.tables.filter(table => !table.isActive);
    return completedTables.reduce((sessionTotal, table) => {
      const tableBuyIn = table.buyIn || 0;
      const tableCashOut = table.cashOut !== undefined ? table.cashOut : 0;
      return sessionTotal + (tableCashOut - tableBuyIn);
    }, 0);
  }
  
  // Otherwise use session-level data (legacy format)
  if (session.cashOut !== undefined && session.cashOut !== null && 
      !isNaN(session.cashOut) && !isNaN(session.buyIn)) {
    return session.cashOut - session.buyIn;
  }
  
  // If no cashOut data, it's a loss of the buy-in amount
  return -session.buyIn;
};

/**
 * Calculate overall results from multiple sessions
 */
export const calculateOverallResults = (sessions: PokerSession[]): number => {
  const completedSessions = sessions.filter(s => 
    !s.isActive && (s.currentStatus === 'ended' || s.status === 'completed' || !s.status)
  );
  
  return completedSessions.reduce((total, session) => {
    return total + calculateSessionProfit(session);
  }, 0);
};
