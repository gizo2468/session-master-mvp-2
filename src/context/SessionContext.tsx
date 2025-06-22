
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { PokerSession, SessionFilter, HandData, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/ui/Lucide';
import { findSupabaseSessionId, syncHandToSupabase, syncHandUpdateToSupabase, syncHandDeleteToSupabase } from '@/utils/handSync';
import { SessionContextType, MAX_STORED_SESSIONS } from './session/types';
import { loadSessions, findActiveSession, clearUserData, clearOtherUserSessions, getUserStorageKey } from './session/storage';
import { syncSessionToSupabase } from './session/supabaseSync';
import { createTableHandHandlers } from './session/handlers';
import { 
  fetchUserSessions, 
  fetchActiveSession,
  saveSessionToDatabase, 
  deleteSessionFromDatabase 
} from '@/utils/database';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessions, setSessions] = useState<PokerSession[]>([]);
  const [activeSession, setActiveSession] = useState<PokerSession | null>(null);
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [isLoadingFromDatabase, setIsLoadingFromDatabase] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
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

  // Load active session from database with error handling
  const loadActiveSessionFromDatabase = async (userId: string | null) => {
    if (!userId) return null;
    
    try {
      console.log('🔄 Loading active session from database for user:', userId);
      const activeSession = await fetchActiveSession();
      if (activeSession) {
        console.log('✅ Found active session:', activeSession.id);
        return activeSession;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to load active session from database:', error);
      // Don't throw, just return null and continue with localStorage fallback
      return null;
    }
  };

  // Enhanced session refresh function with error handling
  const refreshSessionsFromDatabase = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Refreshing sessions from database');
      setIsLoadingFromDatabase(true);
      
      // Load fresh data from database
      const databaseSessions = await fetchUserSessions();
      const freshActiveSession = await loadActiveSessionFromDatabase(user.id);
      
      console.log(`✅ Refreshed ${databaseSessions.length} sessions from database`);
      
      setSessions(databaseSessions);
      setActiveSession(freshActiveSession);
      
    } catch (error) {
      console.error('❌ Failed to refresh sessions from database:', error);
      toast({
        title: "Database Error",
        description: "Failed to refresh sessions from database. Using local data.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingFromDatabase(false);
    }
  };

  // Load sessions from database with fallback to localStorage
  const loadSessionsFromSources = async (userId: string | null) => {
    setIsLoadingFromDatabase(true);
    let loadedSessions: PokerSession[] = [];
    let loadedActiveSession: PokerSession | null = null;

    if (userId) {
      try {
        console.log('🔄 Loading sessions from database for user:', userId);
        
        // First, load the active session specifically
        loadedActiveSession = await loadActiveSessionFromDatabase(userId);
        
        // Then load all sessions
        const databaseSessions = await fetchUserSessions();
        loadedSessions = databaseSessions;
        console.log(`✅ Loaded ${loadedSessions.length} sessions from database`);
        
        // Set active session from database if found
        if (loadedActiveSession) {
          setActiveSession(loadedActiveSession);
        } else {
          // Fallback to finding active session in loaded sessions
          const foundActiveSession = findActiveSession(loadedSessions);
          setActiveSession(foundActiveSession);
        }
      } catch (error) {
        console.error('❌ Failed to load from database, falling back to localStorage:', error);
        
        // Fallback to localStorage
        try {
          loadedSessions = loadSessions(userId);
          setActiveSession(findActiveSession(loadedSessions));
          console.log(`✅ Loaded ${loadedSessions.length} sessions from localStorage as fallback`);
        } catch (localStorageError) {
          console.error('❌ Failed to load from localStorage:', localStorageError);
          setInitializationError('Failed to load session data. Please refresh the page.');
          loadedSessions = [];
          setActiveSession(null);
        }
      }
    } else {
      // User not logged in, load from localStorage
      try {
        loadedSessions = loadSessions(userId);
        setActiveSession(findActiveSession(loadedSessions));
      } catch (error) {
        console.error('❌ Failed to load from localStorage (no user):', error);
        loadedSessions = [];
        setActiveSession(null);
      }
    }

    setIsLoadingFromDatabase(false);
    return loadedSessions;
  };

  // Initialize sessions on mount and when user changes with better error handling
  useEffect(() => {
    const initializeSessions = async () => {
      try {
        console.log('🔄 User changed, reinitializing sessions. User:', user?.id);
        
        // Clear sessions when user changes or logs out
        if (currentUserId !== user?.id) {
          console.log('👤 User switch detected, clearing sessions');
          
          // Complete reset of all session state
          setSessions([]);
          setActiveSession(null);
          setShowStorageWarning(false);
          setInitializationError(null);
          
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
        
        // Load sessions from database or localStorage
        const loadedSessions = await loadSessionsFromSources(user?.id || null);
        console.log('📋 Loaded sessions for user:', user?.id, 'Count:', loadedSessions.length);
        
        setSessions(loadedSessions);
        setIsInitialized(true);
        
      } catch (error) {
        console.error('❌ Failed to initialize sessions:', error);
        setInitializationError('Failed to initialize session data. Please refresh the page.');
        setIsInitialized(true); // Still set to true to prevent infinite loading
      }
    };

    initializeSessions();
  }, [user?.id, currentUserId]);

  const dismissStorageWarning = () => {
    setShowStorageWarning(false);
    // Remember dismissal for this session
    sessionStorage.setItem('storageWarningDismissed', 'true');
  };

  // Save to both localStorage and database
  const saveSessionsToSources = async (sessionsToSave: PokerSession[]) => {
    // Always save to localStorage for offline access
    if (user?.id) {
      try {
        const sortedSessions = [...sessionsToSave].sort((a, b) => 
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
        console.log('💾 Saved sessions to localStorage key:', storageKey, 'Count:', sessionsToStore.length);
      } catch (error) {
        console.error("Failed to save sessions to localStorage:", error);
        
        toast({
          title: "Storage issue detected",
          description: "There was a problem saving your sessions. Try clearing some old sessions to free up space.",
          variant: "destructive"
        });
      }
    }

    // Save to database if user is logged in
    if (user?.id) {
      // Save each session to database (they will be upserted)
      for (const session of sessionsToSave) {
        try {
          await saveSessionToDatabase(session);
        } catch (error) {
          console.error('Failed to save session to database:', session.id, error);
        }
      }
    }
  };

  useEffect(() => {
    if (!isInitialized || !user?.id) return;
    
    saveSessionsToSources(sessions);
  }, [sessions, user?.id, isInitialized]);

  const addSession = async (session: PokerSession) => {
    const sessionWithInitialBuyIn = {
      ...session,
      initialBuyIn: session.buyIn
    };

    setSessions((prev) => [...prev, sessionWithInitialBuyIn]);
    
    // Immediately save to database if user is logged in
    if (user?.id) {
      try {
        await saveSessionToDatabase(sessionWithInitialBuyIn);
      } catch (error) {
        console.error('Failed to save new session to database:', error);
        toast({
          title: "Sync Warning",
          description: "Session saved locally but failed to sync to cloud. It will sync when connection is restored.",
          variant: "destructive"
        });
      }
    }
  };

  const updateSession = async (updatedSession: PokerSession) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
    
    if (activeSession && activeSession.id === updatedSession.id) {
      setActiveSession(updatedSession);
    }

    // Immediately save to database if user is logged in
    if (user?.id) {
      try {
        await saveSessionToDatabase(updatedSession);
      } catch (error) {
        console.error('Failed to update session in database:', error);
        toast({
          title: "Sync Warning",
          description: "Session updated locally but failed to sync to cloud. It will sync when connection is restored.",
          variant: "destructive"
        });
      }
    }
  };

  const deleteSession = async (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
    
    if (activeSession && activeSession.id === id) {
      setActiveSession(null);
    }

    // Delete from database if user is logged in
    if (user?.id) {
      try {
        await deleteSessionFromDatabase(id);
      } catch (error) {
        console.error('Failed to delete session from database:', error);
        toast({
          title: "Sync Warning",
          description: "Session deleted locally but failed to sync to cloud. It will sync when connection is restored.",
          variant: "destructive"
        });
      }
    }
  };

  const startSession = async (session: PokerSession) => {
    try {
      const sessionWithActive = {
        ...session,
        initialBuyIn: session.buyIn,
        isActive: true,
        currentStatus: 'running' as const,
        sessionDuration: 0,
        hands: [],
        tables: session.tables !== undefined ? session.tables : []
      };
      
      console.log('🎯 Starting session with tables:', sessionWithActive.tables?.length || 0);
      
      setActiveSession(sessionWithActive);
      await addSession(sessionWithActive);
      
      // Ensure the session and its tables are immediately saved to database
      if (user?.id) {
        try {
          console.log('💾 Immediately saving new session to database...');
          await saveSessionToDatabase(sessionWithActive);
          console.log('✅ Session and tables saved to database successfully');
        } catch (error) {
          console.error('❌ Failed to save new session to database:', error);
          toast({
            title: "Warning",
            description: "Session created but may not sync to cloud immediately. It will sync when connection is restored.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      throw error; // Re-throw to be handled by the calling component
    }
  };

  const endSession = async (id: string, cashOut: number, notes?: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      const hasActiveTables = session.tables && session.tables.some(table => table.isActive);
      
      if (hasActiveTables) {
        // Check if all active tables have been properly ended
        const activeTablesWithoutResults = session.tables.filter(table => 
          table.isActive && (table.cashOut === undefined || table.cashOut === null)
        );
        
        if (activeTablesWithoutResults.length > 0) {
          throw new Error("Cannot end session while tables are still active. Please end all active tables first.");
        }
      }
      
      const updatedSession = {
        ...session,
        cashOut,
        notes: notes || session.notes,
        endTime: new Date(),
        isActive: false,
        currentStatus: 'ended' as const,
      };
      
      // Update session locally first
      await updateSession(updatedSession);
      setActiveSession(null);
      
      // Force refresh from database after ending session
      console.log('🔄 Session ended, refreshing session list from database');
      setTimeout(() => {
        refreshSessionsFromDatabase();
      }, 100); // Small delay to ensure database is updated
    }
  };

  // Create table hand handlers
  const tableHandHandlers = createTableHandHandlers(sessions, updateSession, user);

  // Only render children after initialization to prevent context usage before setup
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoadingFromDatabase ? 'Loading your sessions...' : 'Initializing...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (initializationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 mb-4">
            <Icon name="AlertCircle" size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Initialization Error</h2>
          <p className="text-gray-600 mb-4">{initializationError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-poker-feltGreen text-white px-4 py-2 rounded hover:bg-poker-darkGreen transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSession,
        filters,
        showStorageWarning,
        isLoading: isLoadingFromDatabase,
        dismissStorageWarning,
        addSession: async (session) => await addSession(session),
        updateSession: async (session) => await updateSession(session),
        deleteSession: async (id) => await deleteSession(id),
        startSession,
        endSession,
        pauseSession: async (id: string) => {
          const session = sessions.find((s) => s.id === id);
          if (session && session.isActive) {
            const updatedSession = {
              ...session,
              currentStatus: 'paused' as const,
            };
            await updateSession(updatedSession);
          }
        },
        resumeSession: async (id: string) => {
          const session = sessions.find((s) => s.id === id);
          if (session && session.isActive) {
            const updatedSession = {
              ...session,
              currentStatus: 'running' as const,
            };
            await updateSession(updatedSession);
          }
        },
        updateSessionDuration: async (id: string, duration: number) => {
          const session = sessions.find((s) => s.id === id);
          if (session) {
            const updatedSession = {
              ...session,
              sessionDuration: duration,
            };
            await updateSession(updatedSession);
          }
        },
        addRebuy: async (id: string, amount: number) => {
          const session = sessions.find((s) => s.id === id);
          if (session) {
            const currentRebuys = session.rebuys || 0;
            const updatedSession = {
              ...session,
              rebuys: currentRebuys + 1,
              buyIn: session.buyIn + amount
            };
            await updateSession(updatedSession);
          }
        },
        setFilters,
        addHand: async (sessionId: string, hand: Omit<HandData, 'id' | 'createdAt'>) => {
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
            // If tableId is provided, add to that table
            if (hand.tableId) {
              await tableHandHandlers.addTableHand(sessionId, hand.tableId, hand);
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
            
            await updateSession(updatedSession);
          }
        },
        updateHand: async (sessionId: string, hand: HandData) => {
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
            // If tableId is provided, update in that table
            if (hand.tableId) {
              await tableHandHandlers.updateTableHand(sessionId, hand.tableId, hand);
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
              
              await updateSession(updatedSession);
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
                  await tableHandHandlers.deleteTableHand(sessionId, table.id, handId);
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
              
              await updateSession(updatedSession);
            }
          }
        },
        addTableHand: tableHandHandlers.addTableHand,
        updateTableHand: tableHandHandlers.updateTableHand,
        deleteTableHand: tableHandHandlers.deleteTableHand,
        addTable: async (sessionId: string, table: Omit<TableData, 'id' | 'startTime' | 'isActive'>) => {
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
            
            await updateSession(updatedSession);
          }
        },
        updateTable: async (sessionId: string, updatedTable: TableData) => {
          const session = sessions.find(s => s.id === sessionId);
          if (session && session.tables) {
            const updatedTables = session.tables.map(table => 
              table.id === updatedTable.id ? updatedTable : table
            );
            
            const updatedSession = {
              ...session,
              tables: updatedTables
            };
            
            await updateSession(updatedSession);
          }
        },
        endTable: async (
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
            
            await updateSession(updatedSession);
          }
        },
        addTableRebuy: async (sessionId: string, tableId: string, amount: number) => {
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
            
            await updateSession(updatedSession);
          }
        },
        getTableById: (sessionId: string, tableId: string): TableData | undefined => {
          const session = sessions.find(s => s.id === sessionId);
          if (session && session.tables) {
            return session.tables.find(t => t.id === tableId);
          }
          return undefined;
        },
        deleteTable: async (sessionId: string, tableId: string) => {
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
              
              await updateSession(updatedSession);
            }
          }
        },
        clearAllUserData,
        refreshSessionsFromDatabase,
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
