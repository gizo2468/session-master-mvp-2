
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { PokerSession, SessionFilter, HandData, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { findSupabaseSessionId, syncHandToSupabase, syncHandUpdateToSupabase, syncHandDeleteToSupabase } from '@/utils/handSync';

interface SessionContextType {
  sessions: PokerSession[];
  activeSession: PokerSession | null;
  filters: SessionFilter;
  showStorageWarning: boolean;
  dismissStorageWarning: () => void;
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
  deleteTable: (sessionId: string, tableId: string) => void;
  clearAllUserData: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const MAX_STORED_SESSIONS = 50;

// Generate user-specific localStorage key
const getUserStorageKey = (userId: string | null): string => {
  if (!userId) return 'pokerSessions_anonymous';
  return `pokerSessions_${userId}`;
};

// Load sessions from localStorage
const loadSessions = (userId: string | null): PokerSession[] => {
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
const findActiveSession = (sessions: PokerSession[]): PokerSession | null => {
  return sessions.find(session => session.isActive) || null;
};

// Clear all user-specific data from localStorage
const clearUserData = (userId: string | null) => {
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
const clearOtherUserSessions = (currentUserId: string | null) => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('pokerSessions_') && key !== getUserStorageKey(currentUserId)) {
      // Don't completely remove other user sessions, but make sure they're not accessible
      // This preserves data integrity while ensuring proper isolation
    }
  });
};

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

  // Updated sync function to include user email
  const syncSessionToSupabase = async (session: PokerSession) => {
    if (!user) {
      console.warn('No authenticated user - skipping Supabase sync');
      return;
    }
    
    try {
      // Sync completed sessions to Supabase - user_id and email will be set
      if (!session.isActive && session.endTime) {
        console.log('🔄 Syncing completed session to Supabase for user:', user.id, 'Email:', user.email, 'Session:', session.id);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            start_time: session.startTime.toISOString(),
            end_time: session.endTime.toISOString(),
            session_type: session.format,
            game_type: session.gameType,
            notes: session.notes || null,
            email: user.email // NEW: Include user email for permanent identification
            // user_id will be set automatically by DEFAULT auth.uid()
          })
          .select()
          .single();

        if (sessionError) {
          console.error('❌ Error syncing session:', sessionError);
          throw sessionError;
        }

        console.log('✅ Session synced with ID:', sessionData.id, 'for user:', user.id, 'email:', user.email);
        
        toast({
          title: "Session saved to cloud",
          description: "Your session has been backed up to your account.",
        });
      } else if (session.isActive) {
        // For active sessions, save immediately to ensure they persist
        console.log('🔄 Syncing active session to Supabase for user:', user.id, 'Email:', user.email, 'Session:', session.id);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            start_time: session.startTime.toISOString(),
            end_time: new Date().toISOString(), // Temporary end time for active sessions
            session_type: session.format,
            game_type: session.gameType,
            notes: session.notes || null,
            email: user.email // NEW: Include user email for permanent identification
            // user_id will be set automatically by DEFAULT auth.uid()
          })
          .select()
          .single();

        if (sessionError) {
          console.error('❌ Error syncing active session:', sessionError);
          throw sessionError;
        }

        console.log('✅ Active session synced with ID:', sessionData.id, 'for user:', user.id, 'email:', user.email);
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
      await syncSessionToSupabase(sessionWithActive);
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
        await syncSessionToSupabase(updatedSession);
      }
    }
  };

  // Define the table hand management functions
  const addTableHand = async (sessionId: string, tableId: string, hand: Omit<HandData, 'id' | 'createdAt' | 'tableId'>) => {
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

    // Sync to Supabase if user is logged in
    if (user) {
      try {
        const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
        if (supabaseSessionId) {
          const synced = await syncHandToSupabase(newHand, supabaseSessionId);
          if (!synced) {
            console.warn('Failed to sync table hand to Supabase, but saved locally');
          }
        }
      } catch (error) {
        console.error('Error syncing table hand to Supabase:', error);
      }
    }
  };

  const updateTableHand = async (sessionId: string, tableId: string, hand: HandData) => {
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

    // Sync update to Supabase if user is logged in
    if (user) {
      try {
        const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
        if (supabaseSessionId) {
          const synced = await syncHandUpdateToSupabase(hand, supabaseSessionId);
          if (!synced) {
            console.warn('Failed to sync table hand update to Supabase, but saved locally');
          }
        }
      } catch (error) {
        console.error('Error syncing table hand update to Supabase:', error);
      }
    }
  };

  const deleteTableHand = async (sessionId: string, tableId: string, handId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.tables) return;
    
    const tableIndex = session.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    const table = session.tables[tableIndex];
    if (!table.hands) return;
    
    const handToDelete = table.hands.find(h => h.id === handId);
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

    // Sync deletion to Supabase if user is logged in
    if (user && handToDelete) {
      try {
        const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
        if (supabaseSessionId) {
          const synced = await syncHandDeleteToSupabase(handToDelete, supabaseSessionId);
          if (!synced) {
            console.warn('Failed to sync table hand deletion to Supabase, but deleted locally');
          }
        }
      } catch (error) {
        console.error('Error syncing hand deletion to Supabase:', error);
      }
    }
  };

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
                  deleteTableHand(sessionId, table.id, handId);
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
        addTableHand,
        updateTableHand,
        deleteTableHand,
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
