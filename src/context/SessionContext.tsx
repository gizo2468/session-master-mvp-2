
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { PokerSession, SessionFilter, HandData, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';

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
  // New table methods
  addTable: (sessionId: string, table: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => void;
  updateTable: (sessionId: string, table: TableData) => void;
  endTable: (sessionId: string, tableId: string, cashOut: number, notes?: string) => void;
  addTableRebuy: (sessionId: string, tableId: string, amount: number) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const loadSessions = (): PokerSession[] => {
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
      
      // Process tables if they exist
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
  
  useEffect(() => {
    localStorage.setItem('pokerSessions', JSON.stringify(sessions));
  }, [sessions]);

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
      tables: []
    };
    setActiveSession(sessionWithActive);
    addSession(sessionWithActive);
  };

  const endSession = (id: string, cashOut: number, notes?: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      // Check if any tables are still active
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
  
  // New table methods
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
        buyIn: session.buyIn + table.buyIn // Update session total buy-in
      };
      
      updateSession(updatedSession);
    }
  };
  
  const updateTable = (sessionId: string, updatedTable: TableData) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.tables) {
      // Calculate the difference in buy-in if it changed
      const originalTable = session.tables.find(t => t.id === updatedTable.id);
      const buyInDifference = originalTable ? updatedTable.buyIn - originalTable.buyIn : 0;
      
      const updatedTables = session.tables.map(table => 
        table.id === updatedTable.id ? updatedTable : table
      );
      
      const updatedSession = {
        ...session,
        tables: updatedTables,
        buyIn: session.buyIn + buyInDifference // Update session total buy-in
      };
      
      updateSession(updatedSession);
    }
  };
  
  const endTable = (sessionId: string, tableId: string, cashOut: number, notes?: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.tables) {
      const updatedTables = session.tables.map(table => {
        if (table.id === tableId) {
          return {
            ...table,
            isActive: false,
            endTime: new Date(),
            cashOut,
            notes: notes || table.notes
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
      
      // Find the updated table to calculate the session buyIn difference
      const updatedTable = updatedTables.find(t => t.id === tableId);
      const originalTable = session.tables.find(t => t.id === tableId);
      const buyInDifference = (updatedTable && originalTable) ? updatedTable.buyIn - originalTable.buyIn : 0;
      
      const updatedSession = {
        ...session,
        tables: updatedTables,
        buyIn: session.buyIn + buyInDifference // Update session total buy-in
      };
      
      updateSession(updatedSession);
    }
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
