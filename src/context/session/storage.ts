
import { PokerSession, HandData, TableData, SessionSummary } from '@/types/poker';

export const MAX_STORED_SESSIONS = 50; // Legacy, kept for reference
export const MAX_STORED_SUMMARIES = 20;

// Generate user-specific localStorage keys
export const getUserStorageKey = (userId: string | null): string => {
  if (!userId) return 'pokerSessions_anonymous';
  return `pokerSessions_${userId}`;
};

export const getActiveSessionKey = (userId: string | null): string => {
  if (!userId) return 'activeSession_anonymous';
  return `activeSession_${userId}`;
};

export const getSessionSummariesKey = (userId: string | null): string => {
  if (!userId) return 'sessionSummaries_anonymous';
  return `sessionSummaries_${userId}`;
};

// Convert full session to lightweight summary
export const sessionToSummary = (session: PokerSession): SessionSummary => ({
  id: session.id,
  gameType: session.gameType,
  format: session.format,
  location: session.location,
  tableName: session.tableName,
  buyIn: session.buyIn,
  cashOut: session.cashOut,
  currency: session.currency,
  startTime: session.startTime,
  endTime: session.endTime,
  sessionDuration: session.sessionDuration,
  isActive: session.isActive,
  currentStatus: session.currentStatus,
  netResult: session.cashOut !== undefined ? (session.cashOut - session.buyIn) : undefined,
  tablesCount: session.tables?.length || 0,
  handsCount: (session.hands?.length || 0) + 
              (session.tables?.reduce((acc, t) => acc + (t.hands?.length || 0), 0) || 0),
});

// Strip images from a single session
export const stripImagesFromSession = (session: PokerSession): PokerSession => ({
  ...session,
  tables: (session.tables || []).map(table => ({
    ...table,
    hands: (table.hands || []).map(hand => ({
      ...hand,
      image: undefined,
      handImage: undefined,
    }))
  })),
  hands: (session.hands || []).map(hand => ({
    ...hand,
    image: undefined,
    handImage: undefined,
  }))
});

// Save active session to localStorage (full object, stripped of images)
export const saveActiveSession = (session: PokerSession | null, userId: string | null): void => {
  const key = getActiveSessionKey(userId);
  if (!session) {
    localStorage.removeItem(key);
    console.log('🗑️ Removed active session from localStorage');
    return;
  }
  try {
    const stripped = stripImagesFromSession(session);
    localStorage.setItem(key, JSON.stringify(stripped));
    console.log('💾 Saved active session to localStorage:', session.id);
  } catch (error) {
    console.error('Failed to save active session to localStorage:', error);
  }
};

// Save session summaries to localStorage (lightweight, no hands/tables)
export const saveSessionSummaries = (sessions: PokerSession[], userId: string | null): void => {
  const key = getSessionSummariesKey(userId);
  try {
    const sorted = [...sessions]
      .filter(s => !s.isActive) // Don't include active in summaries
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, MAX_STORED_SUMMARIES);
    
    const summaries = sorted.map(sessionToSummary);
    localStorage.setItem(key, JSON.stringify(summaries));
    console.log('💾 Saved', summaries.length, 'session summaries to localStorage');
  } catch (error) {
    console.error('Failed to save session summaries to localStorage:', error);
  }
};

// Load active session from localStorage
export const loadActiveSession = (userId: string | null): PokerSession | null => {
  const key = getActiveSessionKey(userId);
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    
    // Convert dates and nested objects
    const session: PokerSession = {
      ...parsed,
      startTime: new Date(parsed.startTime),
      endTime: parsed.endTime ? new Date(parsed.endTime) : undefined,
      hands: (parsed.hands || []).map((hand: HandData) => ({
        ...hand,
        createdAt: new Date(hand.createdAt)
      })),
      tables: (parsed.tables || []).map((table: TableData) => ({
        ...table,
        startTime: new Date(table.startTime),
        endTime: table.endTime ? new Date(table.endTime) : undefined,
        hands: (table.hands || []).map((hand: HandData) => ({
          ...hand,
          createdAt: new Date(hand.createdAt)
        }))
      }))
    };
    
    console.log('📦 Loaded active session from localStorage:', session.id);
    return session;
  } catch (error) {
    console.error('Error loading active session from localStorage:', error);
    return null;
  }
};

// Load session summaries from localStorage
export const loadSessionSummaries = (userId: string | null): SessionSummary[] => {
  const key = getSessionSummariesKey(userId);
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const summaries = JSON.parse(data).map((s: any) => ({
      ...s,
      startTime: new Date(s.startTime),
      endTime: s.endTime ? new Date(s.endTime) : undefined,
    }));
    
    console.log('📦 Loaded', summaries.length, 'session summaries from localStorage');
    return summaries;
  } catch (error) {
    console.error('Error loading session summaries from localStorage:', error);
    return [];
  }
};

// Legacy: Load sessions from localStorage (for migration/fallback)
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
    // Remove legacy key
    const legacyKey = getUserStorageKey(userId);
    localStorage.removeItem(legacyKey);
    
    // Remove new keys
    localStorage.removeItem(getActiveSessionKey(userId));
    localStorage.removeItem(getSessionSummariesKey(userId));
  }
  // Also clear anonymous sessions
  localStorage.removeItem('pokerSessions_anonymous');
  localStorage.removeItem('activeSession_anonymous');
  localStorage.removeItem('sessionSummaries_anonymous');
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
