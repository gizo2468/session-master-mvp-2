
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { PokerSession, SessionFilter, HandData, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { findSupabaseSessionId, syncHandToSupabase, syncHandUpdateToSupabase, syncHandDeleteToSupabase } from '@/utils/handSync';
import { SessionContextType, MAX_STORED_SESSIONS } from './session/types';
import { loadSessions, findActiveSession, clearUserData, clearOtherUserSessions, getUserStorageKey } from './session/storage';
import { syncSessionToSupabase } from './session/supabaseSync';
import { createTableHandHandlers } from './session/handlers';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessions, setSessions] = useState<PokerSession[]>([]);
  const [activeSession, setActiveSession] = useState<PokerSession | null>(null);
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [filters, setFilters] = useState<SessionFilter>({
    gameType: 'All',
    format: 'All',
    location: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Clear all user data function
  const clearAllUserData = () => {
    console.log('🧹 Clearing all user data');
    setSessions([]);
    setActiveSession(null);
    setFilters({
      gameType: 'All',
      format: 'All',
      location: '',
    });
    setShowStorageWarning(false);
    
    // Clear localStorage for current user
    clearUserData(currentUserId);
  };

  // Initialize sessions on mount and when user changes
  useEffect(() => {
    console.log('🔄 User changed, reinitializing sessions. User:', user?.id);
    
    // Clear sessions when user changes or logs out
    if (currentUserId !== user?.id) {
      console.log('👤 User switch detected, clearing sessions');
      
      // Complete reset of all session state
      setSessions([]);
      setActiveSession(null);
      setShowStorageWarning(false);
      
      // If user logged out (user is null), clear all data
      if (!user) {
        clearUserData(currentUserId);
        setCurrentUserId(null);
        setIsInitialized(true);
        return;
      }
      
      setCurrentUserId(user.id);
      
      // Clear sessions from other users to prevent leakage
      clearOtherUserSessions(user.id);
    }
    
    // Only load sessions if we have a user
    if (user?.id) {
      const loadedSessions = loadSessions(user.id);
      console.log('📋 Loaded sessions for user:', user.id, 'Count:', loadedSessions.length);
      setSessions(loadedSessions);
      setActiveSession(findActiveSession(loadedSessions));
    }
    
    setIsInitialized(true);
  }, [user?.id, currentUserId]);

  const dismissStorageWarning = () => {
    setShowStorageWarning(false);
    // Remember dismissal for this session
    sessionStorage.setItem('storageWarningDismissed', 'true');
  };

  useEffect(() => {
    if (!isInitialized || !user?.id) return;
    
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
          // Check if warning was already dismissed for this session
          const wasDismissed = sessionStorage.getItem('storageWarningDismissed') === 'true';
          if (!wasDismissed) {
            setShowStorageWarning(true);
          }
        }
      }
      
      // Store sessions with user-specific key
      const storageKey = getUserStorageKey(user.id);
      localStorage.setItem(storageKey, JSON.stringify(sessionsToStore));
      console.log('💾 Saved sessions to storage key:', storageKey, 'Count:', sessionsToStore.length);
    } catch (error) {
      console.error("Failed to save sessions to localStorage:", error);
      
      toast({
        title: "Storage issue detected",
        description: "There was a problem saving your sessions. Try clearing some old sessions to free up space.",
        variant: "destructive"
      });
      
      if (activeSession) {
        try {
          const activeStorageKey = `activeSession_${user.id}`;
          localStorage.setItem(activeStorageKey, JSON.stringify(activeSession));
        } catch (e) {
          console.error("Failed to save active session:", e);
        }
      }
    }
  }, [sessions, toast, user?.id, isInitialized]);

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

  const startSession = async (session: PokerSession) => {
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
    
    // Immediately sync active session to Supabase to ensure persistence
    if (user) {
      await syncSessionToSupabase(sessionWithActive, user, toast);
    }
  };

  const endSession = async (id: string, cashOut: number, notes?: string) => {
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
      
      // Sync completed session to Supabase
      if (user) {
        await syncSessionToSupabase(updatedSession, user, toast);
      }
    }
  };

  // Create table hand handlers
  const tableHandHandlers = createTableHandHandlers(sessions, updateSession, user);

  // Only render children after initialization to prevent context usage before setup
  if (!isInitialized) {
    return null;
  }

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSession,
        filters,
        showStorageWarning,
        dismissStorageWarning,
        addSession,
        updateSession,
        deleteSession,
        startSession,
        endSession,
        pauseSession: (id: string) => {
          const session = sessions.find((s) => s.id === id);
          if (session && session.isActive) {
            const updatedSession = {
              ...session,
              currentStatus: 'paused' as const,
            };
            updateSession(updatedSession);
          }
        },
        resumeSession: (id: string) => {
          const session = sessions.find((s) => s.id === id);
          if (session && session.isActive) {
            const updatedSession = {
              ...session,
              currentStatus: 'running' as const,
            };
            updateSession(updatedSession);
          }
        },
        updateSessionDuration: (id: string, duration: number) => {
          const session = sessions.find((s) => s.id === id);
          if (session) {
            const updatedSession = {
              ...session,
              sessionDuration: duration,
            };
            updateSession(updatedSession);
          }
        },
        addRebuy: (id: string, amount: number) => {
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
        },
        setFilters,
        addHand: async (sessionId: string, hand: Omit<HandData, 'id' | 'createdAt'>) => {
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
            // If tableId is provided, add to that table
            if (hand.tableId) {
              tableHandHandlers.addTableHand(sessionId, hand.tableId, hand);
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

            // Sync to Supabase if user is logged in
            if (user) {
              try {
                const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
                if (supabaseSessionId) {
                  const synced = await syncHandToSupabase(newHand, supabaseSessionId);
                  if (!synced) {
                    console.warn('Failed to sync hand to Supabase, but saved locally');
                  }
                }
              } catch (error) {
                console.error('Error syncing hand to Supabase:', error);
              }
            }
          }
        },
        updateHand: async (sessionId: string, hand: HandData) => {
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
            // If tableId is provided, update in that table
            if (hand.tableId) {
              tableHandHandlers.updateTableHand(sessionId, hand.tableId, hand);
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

              // Sync update to Supabase if user is logged in
              if (user) {
                try {
                  const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
                  if (supabaseSessionId) {
                    const synced = await syncHandUpdateToSupabase(hand, supabaseSessionId);
                    if (!synced) {
                      console.warn('Failed to sync hand update to Supabase, but saved locally');
                    }
                  }
                } catch (error) {
                  console.error('Error syncing hand update to Supabase:', error);
                }
              }
            }
          }
        },
        deleteHand: async (sessionId: string, handId: string) => {
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
            // Check if this hand belongs to a table
            if (session.tables && session.tables.length > 0) {
              for (const table of session.tables) {
                if (table.hands && table.hands.some(h => h.id === handId)) {
                  tableHandHandlers.deleteTableHand(sessionId, table.id, handId);
                  return;
                }
              }
            }
            
            if (session.hands) {
              const handToDelete = session.hands.find(h => h.id === handId);
              const updatedHands = session.hands.filter(hand => hand.id !== handId);
              
              const updatedSession = {
                ...session,
                hands: updatedHands
              };
              
              updateSession(updatedSession);

              // Sync deletion to Supabase if user is logged in
              if (user && handToDelete) {
                try {
                  const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
                  if (supabaseSessionId) {
                    const synced = await syncHandDeleteToSupabase(handToDelete, supabaseSessionId);
                    if (!synced) {
                      console.warn('Failed to sync hand deletion to Supabase, but deleted locally');
                    }
                  }
                } catch (error) {
                  console.error('Error syncing hand deletion to Supabase:', error);
                }
              }
            }
          }
        },
        addTableHand: tableHandHandlers.addTableHand,
        updateTableHand: tableHandHandlers.updateTableHand,
        deleteTableHand: tableHandHandlers.deleteTableHand,
        addTable: (sessionId: string, table: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => {
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
        },
        updateTable: (sessionId: string, updatedTable: TableData) => {
          const session = sessions.find(s => s.id === sessionId);
          if (session && session.tables) {
            const updatedTables = session.tables.map(table => 
              table.id === updatedTable.id ? updatedTable : table
            );
            
            const updatedSession = {
              ...session,
              tables: updatedTables
            };
            
            updateSession(updatedSession);
          }
        },
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
        },
        addTableRebuy: (sessionId: string, tableId: string, amount: number) => {
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
        },
        getTableById: (sessionId: string, tableId: string): TableData | undefined => {
          const session = sessions.find(s => s.id === sessionId);
          if (session && session.tables) {
            return session.tables.find(t => t.id === tableId);
          }
          return undefined;
        },
        deleteTable: (sessionId: string, tableId: string) => {
          const session = sessions.find(s => s.id === sessionId);
          if (session && session.tables) {
            const tableToDelete = session.tables.find(t => t.id === tableId);
            if (tableToDelete) {
              const updatedTables = session.tables.filter(table => table.id !== tableId);
              
              const updatedSession = {
                ...session,
                tables: updatedTables,
                buyIn: session.buyIn - tableToDelete.buyIn
              };
              
              updateSession(updatedSession);
            }
          }
        },
        clearAllUserData,
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
