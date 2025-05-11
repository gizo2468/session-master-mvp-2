import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { PokerSession, SessionFilter, HandData, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SessionContextType {
  sessions: PokerSession[];
  activeSession: PokerSession | null;
  filters: SessionFilter;
  addSession: (session: PokerSession) => void;
  updateSession: (session: PokerSession) => void;
  deleteSession: (id: string) => void;
  startSession: (session: PokerSession) => void;
  endSession: (id: string, cashOut: number, notes?: string) => void;
  pauseSession: (id: string) => void;
  resumeSession: (id: string) => void;
  updateSessionDuration: (id: string, duration: number) => void;
  addRebuy: (id: string, amount: number) => void;
  setFilters: (filters: SessionFilter) => void;
  addHand: (sessionId: string, hand: Omit<HandData, 'id' | 'createdAt'>) => void;
  updateHand: (sessionId: string, hand: HandData) => void;
  deleteHand: (sessionId: string, handId: string) => void;
  addTable: (sessionId: string, table: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => void;
  updateTable: (sessionId: string, table: TableData) => void;
  endTable: (
    sessionId: string, 
    tableId: string, 
    cashOut: number, 
    notes?: string,
    bounty?: { 
      bountyCount?: number, 
      bountyAmount?: number,
      finalPosition?: number 
    },
    multiDayInfo?: {
      nextDayStart?: Date,
      chipsCarryover?: number,
      dayEndedWithoutElimination?: boolean
    }
  ) => void;
  addTableRebuy: (sessionId: string, tableId: string, amount: number) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const MAX_STORED_SESSIONS = 50;
const TOAST_THROTTLE_DURATION = 3600000; // 1 hour in milliseconds

const loadSessions = (): PokerSession[] => {
  try {
    const savedSessions = localStorage.getItem('pokerSessions');
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

// Function to check if we should show storage warning
const shouldShowStorageWarning = (): boolean => {
  const lastWarningTime = localStorage.getItem('lastStorageWarningTime');
  if (!lastWarningTime) return true;
  
  const now = Date.now();
  const timeSinceLastWarning = now - parseInt(lastWarningTime);
  return timeSinceLastWarning > TOAST_THROTTLE_DURATION;
};

// Function to update warning timestamp
const updateWarningTimestamp = (): void => {
  localStorage.setItem('lastStorageWarningTime', Date.now().toString());
};

const findActiveSession = (sessions: PokerSession[]): PokerSession | null => {
  return sessions.find(session => session.isActive) || null;
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<PokerSession[]>(loadSessions);
  const [activeSession, setActiveSession] = useState<PokerSession | null>(findActiveSession(loadSessions()));
  const [filters, setFilters] = useState<SessionFilter>({
    gameType: 'All',
    format: 'All',
    location: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const storageWarningShown = useRef(false);

  useEffect(() => {
    try {
      const sortedSessions = [...sessions].sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      
      let sessionsToStore = sortedSessions;
      
      // If we exceed our limit, trim down the sessions but prioritize active ones
      if (sortedSessions.length > MAX_STORED_SESSIONS) {
        const activeSessions = sortedSessions.filter(s => s.isActive);
        const inactiveSessions = sortedSessions.filter(s => !s.isActive).slice(0, MAX_STORED_SESSIONS - activeSessions.length);
        sessionsToStore = [...activeSessions, ...inactiveSessions];
        
        // Only show warning if sessions were actually removed and we haven't shown it recently
        if (sortedSessions.length !== sessionsToStore.length && shouldShowStorageWarning()) {
          updateWarningTimestamp(); // Update the timestamp before showing the toast
          toast({
            title: "Storage limit reached",
            description: `Some older sessions have been removed from local storage to save space.`,
            variant: "default"
          });
        }
      }
      
      localStorage.setItem('pokerSessions', JSON.stringify(sessionsToStore));
    } catch (error) {
      console.error("Failed to save sessions to localStorage:", error);
      
      if (shouldShowStorageWarning()) {
        updateWarningTimestamp(); // Update the timestamp before showing the toast
        toast({
          title: "Storage issue detected",
          description: "There was a problem saving your sessions. Try clearing some old sessions to free up space.",
          variant: "destructive"
        });
      }
      
      if (activeSession) {
        try {
          localStorage.setItem('activeSession', JSON.stringify(activeSession));
        } catch (e) {
          console.error("Failed to save active session:", e);
        }
      }
    }
  }, [sessions, toast]);

  // Sync sessions to Supabase in the background
  useEffect(() => {
    // Only run this effect when user is logged in and there are sessions to sync
    if (!user || sessions.length === 0) return;
    
    const syncOldSessionsToSupabase = async () => {
      // Find completed sessions that aren't marked as synced yet
      const completedSessions = sessions.filter(s => 
        !s.isActive && s.endTime && !s.syncedToSupabase
      );
      
      if (completedSessions.length === 0) return;
      
      // Sync up to 5 sessions at a time to avoid overloading
      for (const session of completedSessions.slice(0, 5)) {
        try {
          await syncSessionToSupabase(session);
          
          // Mark as synced in local storage
          setSessions(prev => prev.map(s => 
            s.id === session.id ? {...s, syncedToSupabase: true} : s
          ));
        } catch (error) {
          console.error("Error syncing session to Supabase:", error);
        }
      }
    };
    
    // Run the sync operation with a slight delay to prioritize UI
    const timerId = setTimeout(syncOldSessionsToSupabase, 5000);
    return () => clearTimeout(timerId);
  }, [sessions, user]);

  // Sync completed sessions to Supabase
  const syncSessionToSupabase = async (session: PokerSession) => {
    if (!user) return;
    
    try {
      // Only sync completed sessions to Supabase
      if (!session.isActive && session.endTime) {
        await supabase.from('sessions').insert({
          user_id: user.id,
          start_time: new Date(session.startTime).toISOString(),
          end_time: new Date(session.endTime).toISOString(),
          session_type: session.format,
          game_type: session.gameType,
          notes: session.notes || null
        });
        
        if (shouldShowStorageWarning()) {
          updateWarningTimestamp();
          toast({
            title: "Session saved to cloud",
            description: "Your session has been backed up to your account.",
          });
        }
        
        return true;
      }
    } catch (error) {
      console.error("Error syncing session to Supabase:", error);
      if (shouldShowStorageWarning()) {
        updateWarningTimestamp();
        toast({
          title: "Cloud sync failed",
          description: "Unable to save session to cloud. Your data is still saved locally.",
          variant: "destructive"
        });
      }
      throw error;
    }
  };

  const addSession = (session: PokerSession) => {
    const sessionWithInitialBuyIn = {
      ...session,
      initialBuyIn: session.buyIn
    };

    setSessions((prev) => [...prev, sessionWithInitialBuyIn]);
  };

  const updateSession = (updatedSession: PokerSession) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
    
    if (activeSession && activeSession.id === updatedSession.id) {
      setActiveSession(updatedSession);
    }
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
    
    if (activeSession && activeSession.id === id) {
      setActiveSession(null);
    }
  };

  const startSession = (session: PokerSession) => {
    const sessionWithActive = {
      ...session,
      initialBuyIn: session.buyIn,
      isActive: true,
      currentStatus: 'running' as const,
      sessionDuration: 0,
      hands: [],
      tables: session.tables !== undefined ? session.tables : []
    };
    setActiveSession(sessionWithActive);
    addSession(sessionWithActive);
  };

  const endSession = (id: string, cashOut: number, notes?: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      const hasActiveTables = session.tables && session.tables.some(table => table.isActive);
      
      if (hasActiveTables) {
        throw new Error("Cannot end session while tables are still active");
      }
      
      const updatedSession = {
        ...session,
        cashOut,
        notes: notes || session.notes,
        endTime: new Date(),
        isActive: false,
        currentStatus: 'ended' as const,
      };
      updateSession(updatedSession);
      setActiveSession(null);
      
      // Schedule sync to Supabase in the background
      setTimeout(() => syncSessionToSupabase(updatedSession), 1000);
    }
  };
  
  const pauseSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session && session.isActive) {
      const updatedSession = {
        ...session,
        currentStatus: 'paused' as const,
      };
      updateSession(updatedSession);
    }
  };
  
  const resumeSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session && session.isActive) {
      const updatedSession = {
        ...session,
        currentStatus: 'running' as const,
      };
      updateSession(updatedSession);
    }
  };
  
  const updateSessionDuration = (id: string, duration: number) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      const updatedSession = {
        ...session,
        sessionDuration: duration,
      };
      updateSession(updatedSession);
    }
  };

  const addRebuy = (id: string, amount: number) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      const currentRebuys = session.rebuys || 0;
      const updatedSession = {
        ...session,
        rebuys: currentRebuys + 1,
        buyIn: session.buyIn + amount
      };
      updateSession(updatedSession);
    }
  };

  const addHand = (sessionId: string, hand: Omit<HandData, 'id' | 'createdAt'>) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const newHand: HandData = {
        ...hand,
        id: uuidv4(),
        createdAt: new Date()
      };
      
      const updatedSession = {
        ...session,
        hands: [...(session.hands || []), newHand]
      };
      
      updateSession(updatedSession);
    }
  };
  
  const updateHand = (sessionId: string, hand: HandData) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.hands) {
      const updatedHands = session.hands.map(h => 
        h.id === hand.id ? hand : h
      );
      
      const updatedSession = {
        ...session,
        hands: updatedHands
      };
      
      updateSession(updatedSession);
    }
  };
  
  const deleteHand = (sessionId: string, handId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.hands) {
      const updatedHands = session.hands.filter(hand => hand.id !== handId);
      
      const updatedSession = {
        ...session,
        hands: updatedHands
      };
      
      updateSession(updatedSession);
    }
  };
  
  const addTable = (sessionId: string, table: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const newTable: TableData = {
        ...table,
        id: uuidv4(),
        startTime: new Date(),
        isActive: true,
        initialBuyIn: table.buyIn,
      };
      
      const updatedSession = {
        ...session,
        tables: [...(session.tables || []), newTable],
        buyIn: session.buyIn + table.buyIn
      };
      
      updateSession(updatedSession);
    }
  };
  
  const updateTable = (sessionId: string, updatedTable: TableData) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.tables) {
      const originalTable = session.tables.find(t => t.id === updatedTable.id);
      const buyInDifference = originalTable ? updatedTable.buyIn - originalTable.buyIn : 0;
      
      const updatedTables = session.tables.map(table => 
        table.id === updatedTable.id ? updatedTable : table
      );
      
      const updatedSession = {
        ...session,
        tables: updatedTables,
        buyIn: session.buyIn + buyInDifference
      };
      
      updateSession(updatedSession);
    }
  };
  
  const endTable = (
    sessionId: string, 
    tableId: string, 
    cashOut: number, 
    notes?: string,
    bounty?: { 
      bountyCount?: number, 
      bountyAmount?: number,
      finalPosition?: number 
    },
    multiDayInfo?: {
      nextDayStart?: Date,
      chipsCarryover?: number,
      dayEndedWithoutElimination?: boolean
    }
  ) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.tables) {
      const updatedTables = session.tables.map(table => {
        if (table.id === tableId) {
          return {
            ...table,
            isActive: false,
            endTime: new Date(),
            cashOut: multiDayInfo?.dayEndedWithoutElimination ? 0 : cashOut,
            notes: notes || table.notes,
            ...(bounty?.bountyCount !== undefined && { bountyCount: bounty.bountyCount }),
            ...(bounty?.bountyAmount !== undefined && { bountyAmount: bounty.bountyAmount }),
            ...(bounty?.finalPosition !== undefined && { finalPosition: bounty.finalPosition }),
            ...(multiDayInfo?.nextDayStart && { nextDayStart: multiDayInfo.nextDayStart }),
            ...(multiDayInfo?.chipsCarryover && { chipsCarryover: multiDayInfo.chipsCarryover }),
            ...(multiDayInfo?.dayEndedWithoutElimination && { dayEndedWithoutElimination: true })
          };
        }
        return table;
      });
      
      const updatedSession = {
        ...session,
        tables: updatedTables
      };
      
      updateSession(updatedSession);
    }
  };
  
  const addTableRebuy = (sessionId: string, tableId: string, amount: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.tables) {
      const updatedTables = session.tables.map(table => {
        if (table.id === tableId) {
          const currentRebuys = table.rebuys || 0;
          return {
            ...table,
            rebuys: currentRebuys + 1,
            buyIn: table.buyIn + amount
          };
        }
        return table;
      });
      
      const updatedTable = updatedTables.find(t => t.id === tableId);
      const originalTable = session.tables.find(t => t.id === tableId);
      const buyInDifference = (updatedTable && originalTable) ? updatedTable.buyIn - originalTable.buyIn : 0;
      
      const updatedSession = {
        ...session,
        tables: updatedTables,
        buyIn: session.buyIn + buyInDifference
      };
      
      updateSession(updatedSession);
    }
  };

  const setFilters = (filters: SessionFilter) => {
    setFilters(filters);
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSession,
        filters,
        addSession,
        updateSession,
        deleteSession,
        startSession,
        endSession,
        pauseSession,
        resumeSession,
        updateSessionDuration,
        addRebuy,
        setFilters,
        addHand,
        updateHand,
        deleteHand,
        addTable,
        updateTable,
        endTable,
        addTableRebuy,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}
