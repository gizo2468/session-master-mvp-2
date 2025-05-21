import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
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
  addTableHand: (sessionId: string, tableId: string, hand: Omit<HandData, 'id' | 'createdAt' | 'tableId'>) => void;
  updateTableHand: (sessionId: string, tableId: string, hand: HandData) => void;
  deleteTableHand: (sessionId: string, tableId: string, handId: string) => void;
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
  getTableById: (sessionId: string, tableId: string) => TableData | undefined;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const MAX_STORED_SESSIONS = 50;

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

  useEffect(() => {
    try {
      const sortedSessions = [...sessions].sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      
      let sessionsToStore = sortedSessions;
      
      if (sortedSessions.length > MAX_STORED_SESSIONS) {
        const activeSessions = sortedSessions.filter(s => s.isActive);
        const inactiveSessions = sortedSessions.filter(s => !s.isActive).slice(0, MAX_STORED_SESSIONS - activeSessions.length);
        sessionsToStore = [...activeSessions, ...inactiveSessions];
        
        if (sortedSessions.length !== sessionsToStore.length) {
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
      
      toast({
        title: "Storage issue detected",
        description: "There was a problem saving your sessions. Try clearing some old sessions to free up space.",
        variant: "destructive"
      });
      
      if (activeSession) {
        try {
          localStorage.setItem('activeSession', JSON.stringify(activeSession));
        } catch (e) {
          console.error("Failed to save active session:", e);
        }
      }
    }
  }, [sessions, toast]);

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
        
        toast({
          title: "Session saved to cloud",
          description: "Your session has been backed up to your account.",
        });
      }
    } catch (error) {
      console.error("Error syncing session to Supabase:", error);
      toast({
        title: "Cloud sync failed",
        description: "Unable to save session to cloud. Your data is still saved locally.",
        variant: "destructive"
      });
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
      
      // Sync to Supabase if user is logged in
      syncSessionToSupabase(updatedSession);
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
      // If tableId is provided, add to that table
      if (hand.tableId) {
        addTableHand(sessionId, hand.tableId, hand);
        return;
      }
      
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
    if (session) {
      // If tableId is provided, update in that table
      if (hand.tableId) {
        updateTableHand(sessionId, hand.tableId, hand);
        return;
      }
      
      if (session.hands) {
        const updatedHands = session.hands.map(h => 
          h.id === hand.id ? hand : h
        );
        
        const updatedSession = {
          ...session,
          hands: updatedHands
        };
        
        updateSession(updatedSession);
      }
    }
  };
  
  const deleteHand = (sessionId: string, handId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      // Check if this hand belongs to a table
      if (session.tables && session.tables.length > 0) {
        for (const table of session.tables) {
          if (table.hands && table.hands.some(h => h.id === handId)) {
            deleteTableHand(sessionId, table.id, handId);
            return;
          }
        }
      }
      
      if (session.hands) {
        const updatedHands = session.hands.filter(hand => hand.id !== handId);
        
        const updatedSession = {
          ...session,
          hands: updatedHands
        };
        
        updateSession(updatedSession);
      }
    }
  };
  
  const addTableHand = (sessionId: string, tableId: string, hand: Omit<HandData, 'id' | 'createdAt' | 'tableId'>) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.tables) return;
    
    const tableIndex = session.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    const table = session.tables[tableIndex];
    const tableFormat = table.format;
    
    const newHand: HandData = {
      ...hand,
      id: uuidv4(),
      createdAt: new Date(),
      tableId: tableId,
      // Auto-determine currency type based on table format
      currencyType: tableFormat === 'Cash' ? 'currency' : 'chips'
    };
    
    const updatedTable = {
      ...table,
      hands: [...(table.hands || []), newHand]
    };
    
    const updatedTables = [...session.tables];
    updatedTables[tableIndex] = updatedTable;
    
    const updatedSession = {
      ...session,
      tables: updatedTables
    };
    
    updateSession(updatedSession);
  };
  
  const updateTableHand = (sessionId: string, tableId: string, hand: HandData) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.tables) return;
    
    const tableIndex = session.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    const table = session.tables[tableIndex];
    if (!table.hands) return;
    
    const updatedHands = table.hands.map(h => 
      h.id === hand.id ? hand : h
    );
    
    const updatedTable = {
      ...table,
      hands: updatedHands
    };
    
    const updatedTables = [...session.tables];
    updatedTables[tableIndex] = updatedTable;
    
    const updatedSession = {
      ...session,
      tables: updatedTables
    };
    
    updateSession(updatedSession);
  };
  
  const deleteTableHand = (sessionId: string, tableId: string, handId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.tables) return;
    
    const tableIndex = session.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    const table = session.tables[tableIndex];
    if (!table.hands) return;
    
    const updatedHands = table.hands.filter(hand => hand.id !== handId);
    
    const updatedTable = {
      ...table,
      hands: updatedHands
    };
    
    const updatedTables = [...session.tables];
    updatedTables[tableIndex] = updatedTable;
    
    const updatedSession = {
      ...session,
      tables: updatedTables
    };
    
    updateSession(updatedSession);
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
  
  const getTableById = (sessionId: string, tableId: string): TableData | undefined => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.tables) {
      return session.tables.find(t => t.id === tableId);
    }
    return undefined;
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
        addTableHand,
        updateTableHand,
        deleteTableHand,
        addTable,
        updateTable,
        endTable,
        addTableRebuy,
        getTableById,
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
