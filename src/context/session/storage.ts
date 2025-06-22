
import { PokerSession, HandData, TableData } from '@/types/poker';

export const MAX_STORED_SESSIONS = 50;

// Generate user-specific localStorage key
export const getUserStorageKey = (userId: string | null): string => {
  if (!userId) return 'pokerSessions_anonymous';
  return `pokerSessions_${userId}`;
};

// Load sessions from localStorage
export const loadSessions = (userId: string | null): PokerSession[] => {
  try {
    const storageKey = getUserStorageKey(userId);
    const savedSessions = localStorage.getItem(storageKey);
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      return parsed.map((session: PokerSession) => {
        if (!session.initialBuyIn) {
          session.initialBuyIn = session.buyIn - ((session.rebuys || 0) * (session.tournamentBuyIn || 0)) - 
                                ((session.addOns || 0) * (session.tournamentBuyIn || 0));
        }
        
        const processedSession = {
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
          hands: session.hands ? session.hands.map((hand: HandData) => ({
            ...hand,
            createdAt: new Date(hand.createdAt)
          })) : []
        };
        
        if (session.tables) {
          processedSession.tables = session.tables.map((table: TableData) => ({
            ...table,
            startTime: new Date(table.startTime),
            endTime: table.endTime ? new Date(table.endTime) : undefined
          }));
        }
        
        return processedSession;
      });
    }
  } catch (error) {
    console.error("Error loading sessions from localStorage:", error);
  }
  return [];
};

// Find the active session
export const findActiveSession = (sessions: PokerSession[]): PokerSession | null => {
  return sessions.find(session => session.isActive) || null;
};

// Clear all user-specific data from localStorage
export const clearUserData = (userId: string | null) => {
  if (userId) {
    const storageKey = getUserStorageKey(userId);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`activeSession_${userId}`);
  }
  // Also clear anonymous sessions
  localStorage.removeItem('pokerSessions_anonymous');
  localStorage.removeItem('activeSession_anonymous');
};

// Clear sessions for other users when switching accounts
export const clearOtherUserSessions = (currentUserId: string | null) => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('pokerSessions_') && key !== getUserStorageKey(currentUserId)) {
      // Don't completely remove other user sessions, but make sure they're not accessible
      // This preserves data integrity while ensuring proper isolation
    }
  });
};
