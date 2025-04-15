
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { PokerSession, SessionFilter } from '@/types/poker';

interface SessionContextType {
  sessions: PokerSession[];
  activeSession: PokerSession | null;
  filters: SessionFilter;
  addSession: (session: PokerSession) => void;
  updateSession: (session: PokerSession) => void;
  deleteSession: (id: string) => void;
  startSession: (session: PokerSession) => void;
  endSession: (id: string, cashOut: number) => void;
  setFilters: (filters: SessionFilter) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Load data from localStorage
const loadSessions = (): PokerSession[] => {
  const savedSessions = localStorage.getItem('pokerSessions');
  if (savedSessions) {
    const parsed = JSON.parse(savedSessions);
    return parsed.map((session: PokerSession) => ({
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined
    }));
  }
  return [];
};

// Find active session if any
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
  
  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pokerSessions', JSON.stringify(sessions));
  }, [sessions]);

  // Add a new session
  const addSession = (session: PokerSession) => {
    setSessions((prev) => [...prev, session]);
  };

  // Update an existing session
  const updateSession = (updatedSession: PokerSession) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
  };

  // Delete a session
  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
  };

  // Start a new active session
  const startSession = (session: PokerSession) => {
    const sessionWithActive = {
      ...session,
      isActive: true,
    };
    setActiveSession(sessionWithActive);
    addSession(sessionWithActive);
  };

  // End an active session
  const endSession = (id: string, cashOut: number) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      const updatedSession = {
        ...session,
        cashOut,
        endTime: new Date(),
        isActive: false,
      };
      updateSession(updatedSession);
      setActiveSession(null);
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
        setFilters,
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
