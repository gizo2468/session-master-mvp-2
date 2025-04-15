
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { PokerSession, SessionFilter, HandData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';

interface SessionContextType {
  sessions: PokerSession[];
  activeSession: PokerSession | null;
  filters: SessionFilter;
  addSession: (session: PokerSession) => void;
  updateSession: (session: PokerSession) => void;
  deleteSession: (id: string) => void;
  startSession: (session: PokerSession) => void;
  endSession: (id: string, cashOut: number) => void;
  pauseSession: (id: string) => void;
  resumeSession: (id: string) => void;
  updateSessionDuration: (id: string, duration: number) => void;
  addRebuy: (id: string, amount: number) => void;
  addAddon: (id: string, amount: number) => void;
  setFilters: (filters: SessionFilter) => void;
  // Hand management methods
  addHand: (sessionId: string, hand: Omit<HandData, 'id' | 'createdAt'>) => void;
  updateHand: (sessionId: string, hand: HandData) => void;
  deleteHand: (sessionId: string, handId: string) => void;
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
      endTime: session.endTime ? new Date(session.endTime) : undefined,
      hands: session.hands ? session.hands.map((hand: HandData) => ({
        ...hand,
        createdAt: new Date(hand.createdAt)
      })) : []
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
    
    // Also update active session if it's the same session
    if (activeSession && activeSession.id === updatedSession.id) {
      setActiveSession(updatedSession);
    }
  };

  // Delete a session
  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
    
    // Clear active session if it's the deleted one
    if (activeSession && activeSession.id === id) {
      setActiveSession(null);
    }
  };

  // Start a new active session
  const startSession = (session: PokerSession) => {
    const sessionWithActive = {
      ...session,
      isActive: true,
      currentStatus: 'running' as const,
      sessionDuration: 0,
      hands: []
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
        currentStatus: 'ended' as const,
      };
      updateSession(updatedSession);
      setActiveSession(null);
    }
  };
  
  // Pause an active session
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
  
  // Resume a paused session
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
  
  // Update the duration of a session
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
  
  // Add a rebuy to a tournament session
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
  
  // Add an add-on to a tournament session
  const addAddon = (id: string, amount: number) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      const currentAddOns = session.addOns || 0;
      const updatedSession = {
        ...session,
        addOns: currentAddOns + 1,
        buyIn: session.buyIn + amount
      };
      updateSession(updatedSession);
    }
  };
  
  // Add a new hand to a session
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
  
  // Update an existing hand
  const updateHand = (sessionId: string, updatedHand: HandData) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.hands) {
      const updatedHands = session.hands.map(hand => 
        hand.id === updatedHand.id ? updatedHand : hand
      );
      
      const updatedSession = {
        ...session,
        hands: updatedHands
      };
      
      updateSession(updatedSession);
    }
  };
  
  // Delete a hand
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
        addAddon,
        setFilters,
        addHand,
        updateHand,
        deleteHand,
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
