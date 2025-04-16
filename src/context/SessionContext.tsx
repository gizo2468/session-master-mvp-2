import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { PokerSession, PokerTable, SessionFilter, HandData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';

interface SessionContextType {
  sessions: PokerSession[];
  activeSession: PokerSession | null;
  filters: SessionFilter;
  addSession: (session: PokerSession) => void;
  updateSession: (session: PokerSession) => void;
  deleteSession: (id: string) => void;
  startSession: (sessionData: Omit<PokerSession, 'id' | 'startTime' | 'isActive' | 'tables'>) => void;
  endSession: (id: string, notes?: string) => void;
  updateSessionNotes: (id: string, notes: string) => void;
  
  addTable: (sessionId: string, table: Omit<PokerTable, 'id' | 'startTime' | 'isActive' | 'hands'>) => string;
  updateTable: (sessionId: string, table: PokerTable) => void;
  endTable: (sessionId: string, tableId: string, cashOut: number, notes?: string) => void;
  deleteTable: (sessionId: string, tableId: string) => void;
  
  addHand: (sessionId: string, tableId: string, hand: Omit<HandData, 'id' | 'createdAt' | 'tableId'>) => void;
  updateHand: (sessionId: string, tableId: string, hand: HandData) => void;
  deleteHand: (sessionId: string, tableId: string, handId: string) => void;
  
  setFilters: (filters: SessionFilter) => void;
  addRebuy: (sessionId: string, tableId: string, amount: number) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const loadSessions = (): PokerSession[] => {
  const savedSessions = localStorage.getItem('pokerSessions');
  if (savedSessions) {
    const parsed = JSON.parse(savedSessions);
    
    return parsed.map((session: any) => {
      if (!session.tables) {
        const newTable: PokerTable = {
          id: uuidv4(),
          name: `${session.gameType} ${session.format}`,
          gameType: session.gameType,
          format: session.format,
          buyIn: session.buyIn,
          initialBuyIn: session.initialBuyIn || session.buyIn,
          cashOut: session.cashOut,
          smallBlind: session.smallBlind,
          bigBlind: session.bigBlind,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
          notes: session.notes,
          isActive: session.isActive || false,
          tournamentBuyIn: session.tournamentBuyIn,
          rebuys: session.rebuys,
          addOns: session.addOns,
          finalPosition: session.finalPosition,
          hands: session.hands ? session.hands.map((hand: any) => ({
            ...hand,
            tableId: hand.tableId || uuidv4(),
            createdAt: new Date(hand.createdAt)
          })) : []
        };
        
        return {
          id: session.id,
          location: session.location,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
          isActive: session.isActive || false,
          notes: session.notes,
          tables: [newTable]
        };
      }
      
      return {
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        tables: session.tables.map((table: any) => ({
          ...table,
          startTime: new Date(table.startTime),
          endTime: table.endTime ? new Date(table.endTime) : undefined,
          hands: table.hands ? table.hands.map((hand: any) => ({
            ...hand,
            createdAt: new Date(hand.createdAt)
          })) : []
        }))
      };
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
    setSessions((prev) => [...prev, session]);
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

  const startSession = (sessionData: Omit<PokerSession, 'id' | 'startTime' | 'isActive' | 'tables'>) => {
    const newSession: PokerSession = {
      id: uuidv4(),
      ...sessionData,
      startTime: new Date(),
      isActive: true,
      tables: []
    };
    
    setActiveSession(newSession);
    addSession(newSession);
  };

  const endSession = (id: string, notes?: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      const updatedTables = session.tables.map(table => {
        if (table.isActive) {
          return {
            ...table,
            endTime: new Date(),
            isActive: false
          };
        }
        return table;
      });
      
      const updatedSession = {
        ...session,
        tables: updatedTables,
        endTime: new Date(),
        isActive: false,
        notes: notes !== undefined ? notes : session.notes
      };
      
      updateSession(updatedSession);
      setActiveSession(null);
    }
  };
  
  const updateSessionNotes = (id: string, notes: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      const updatedSession = {
        ...session,
        notes
      };
      updateSession(updatedSession);
    }
  };
  
  const addTable = (sessionId: string, tableData: Omit<PokerTable, 'id' | 'startTime' | 'isActive' | 'hands'>) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      const newTableId = uuidv4();
      const newTable: PokerTable = {
        id: newTableId,
        ...tableData,
        startTime: new Date(),
        isActive: true,
        initialBuyIn: tableData.buyIn,
        hands: []
      };
      
      const updatedSession = {
        ...session,
        tables: [...session.tables, newTable]
      };
      
      updateSession(updatedSession);
      return newTableId;
    }
    return "";
  };
  
  const updateTable = (sessionId: string, updatedTable: PokerTable) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      const updatedTables = session.tables.map(table => 
        table.id === updatedTable.id ? updatedTable : table
      );
      
      const updatedSession = {
        ...session,
        tables: updatedTables
      };
      
      updateSession(updatedSession);
    }
  };
  
  const endTable = (sessionId: string, tableId: string, cashOut: number, notes?: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      const updatedTables = session.tables.map(table => {
        if (table.id === tableId) {
          return {
            ...table,
            cashOut,
            endTime: new Date(),
            isActive: false,
            notes: notes !== undefined ? notes : table.notes
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
  
  const deleteTable = (sessionId: string, tableId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      const updatedTables = session.tables.filter(table => table.id !== tableId);
      
      const updatedSession = {
        ...session,
        tables: updatedTables
      };
      
      updateSession(updatedSession);
    }
  };
  
  const addHand = (sessionId: string, tableId: string, handData: Omit<HandData, 'id' | 'createdAt' | 'tableId'>) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const tableIndex = session.tables.findIndex(t => t.id === tableId);
      if (tableIndex !== -1) {
        const newHand: HandData = {
          ...handData,
          id: uuidv4(),
          createdAt: new Date(),
          tableId: tableId
        };
        
        const updatedTable = {
          ...session.tables[tableIndex],
          hands: [...(session.tables[tableIndex].hands || []), newHand]
        };
        
        const updatedTables = [...session.tables];
        updatedTables[tableIndex] = updatedTable;
        
        const updatedSession = {
          ...session,
          tables: updatedTables
        };
        
        updateSession(updatedSession);
      }
    }
  };
  
  const updateHand = (sessionId: string, tableId: string, updatedHand: HandData) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const tableIndex = session.tables.findIndex(t => t.id === tableId);
      if (tableIndex !== -1 && session.tables[tableIndex].hands) {
        const updatedHands = session.tables[tableIndex].hands!.map(hand => 
          hand.id === updatedHand.id ? updatedHand : hand
        );
        
        const updatedTable = {
          ...session.tables[tableIndex],
          hands: updatedHands
        };
        
        const updatedTables = [...session.tables];
        updatedTables[tableIndex] = updatedTable;
        
        const updatedSession = {
          ...session,
          tables: updatedTables
        };
        
        updateSession(updatedSession);
      }
    }
  };
  
  const deleteHand = (sessionId: string, tableId: string, handId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const tableIndex = session.tables.findIndex(t => t.id === tableId);
      if (tableIndex !== -1 && session.tables[tableIndex].hands) {
        const updatedHands = session.tables[tableIndex].hands!.filter(hand => hand.id !== handId);
        
        const updatedTable = {
          ...session.tables[tableIndex],
          hands: updatedHands
        };
        
        const updatedTables = [...session.tables];
        updatedTables[tableIndex] = updatedTable;
        
        const updatedSession = {
          ...session,
          tables: updatedTables
        };
        
        updateSession(updatedSession);
      }
    }
  };
  
  const addRebuy = (sessionId: string, tableId: string, amount: number) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      const tableIndex = session.tables.findIndex(t => t.id === tableId);
      if (tableIndex !== -1) {
        const table = session.tables[tableIndex];
        const currentRebuys = table.rebuys || 0;
        
        const updatedTable = {
          ...table,
          rebuys: currentRebuys + 1,
          buyIn: table.buyIn + amount
        };
        
        const updatedTables = [...session.tables];
        updatedTables[tableIndex] = updatedTable;
        
        const updatedSession = {
          ...session,
          tables: updatedTables
        };
        
        updateSession(updatedSession);
      }
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
        updateSessionNotes,
        addTable,
        updateTable,
        endTable,
        deleteTable,
        addHand,
        updateHand,
        deleteHand,
        setFilters,
        addRebuy,
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
