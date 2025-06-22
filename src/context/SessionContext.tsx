import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { PokerSession, SessionFilter, HandData, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/ui/Lucide';
import { SessionContextType } from './session/types';
import { useSessionInitialization } from './session/useSessionInitialization';
import { createSessionOperations } from './session/sessionOperations';
import { saveSessionsToSources } from './session/databaseSync';
import { clearUserData } from './session/storage';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [filters, setFilters] = useState<SessionFilter>({
    gameType: 'All',
    format: 'All',
    location: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    isInitialized,
    sessions,
    setSessions,
    activeSession,
    setActiveSession,
    isLoadingFromDatabase,
    initializationError,
    currentUserId,
    refreshSessionsFromDatabase
  } = useSessionInitialization();

  // Create a stable default context value to prevent infinite re-renders
  const defaultContextValue: SessionContextType = {
    sessions: [],
    activeSession: null,
    filters,
    showStorageWarning: false,
    isLoading: false,
    dismissStorageWarning: () => {},
    addSession: async () => {},
    updateSession: async () => {},
    deleteSession: async () => {},
    startSession: async () => {},
    endSession: async () => {},
    pauseSession: async () => {},
    resumeSession: async () => {},
    updateSessionDuration: async () => {},
    addRebuy: async () => {},
    setFilters,
    addHand: async () => {},
    updateHand: async () => {},
    deleteHand: async () => {},
    addTableHand: async () => {},
    updateTableHand: async () => {},
    deleteTableHand: async () => {},
    addTable: async () => {},
    updateTable: async () => {},
    endTable: async () => {},
    addTableRebuy: async () => {},
    getTableById: () => undefined,
    deleteTable: async () => {},
    clearAllUserData: () => {},
    refreshSessionsFromDatabase: async () => {},
  };

  const sessionOperations = createSessionOperations(
    sessions,
    setSessions,
    activeSession,
    setActiveSession,
    user,
    toast,
    refreshSessionsFromDatabase
  );

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
    clearUserData(currentUserId);
  };

  const dismissStorageWarning = () => {
    setShowStorageWarning(false);
    sessionStorage.setItem('storageWarningDismissed', 'true');
  };

  // Save sessions when they change - with debouncing to prevent excessive saves
  useEffect(() => {
    if (!isInitialized || !user?.id) return;
    
    const timeoutId = setTimeout(() => {
      saveSessionsToSources(sessions, user.id, setShowStorageWarning, toast);
    }, 1000); // Debounce saves by 1 second
    
    return () => clearTimeout(timeoutId);
  }, [sessions, user?.id, isInitialized]);

  // Show error state if initialization failed
  if (initializationError) {
    const errorContextValue: SessionContextType = {
      ...defaultContextValue,
      isLoading: false,
    };

    return (
      <SessionContext.Provider value={errorContextValue}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
            <div className="text-red-500 mb-4">
              <Icon name="AlertCircle" size={48} className="mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Initialization Error</h2>
            <p className="text-gray-600 mb-4">{initializationError}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-poker-feltGreen text-white px-4 py-2 rounded hover:bg-poker-darkGreen transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  clearAllUserData();
                  window.location.reload();
                }}
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Clear Data & Refresh
              </button>
            </div>
          </div>
        </div>
      </SessionContext.Provider>
    );
  }

  // Create the full context value
  const contextValue: SessionContextType = isInitialized ? {
    sessions,
    activeSession,
    filters,
    showStorageWarning,
    isLoading: isLoadingFromDatabase,
    dismissStorageWarning,
    addSession: sessionOperations.addSession,
    updateSession: sessionOperations.updateSession,
    deleteSession: sessionOperations.deleteSession,
    startSession: sessionOperations.startSession,
    endSession: sessionOperations.endSession,
    pauseSession: async (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (session && session.isActive) {
        const updatedSession = {
          ...session,
          currentStatus: 'paused' as const,
        };
        await sessionOperations.updateSession(updatedSession);
      }
    },
    resumeSession: async (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (session && session.isActive) {
        const updatedSession = {
          ...session,
          currentStatus: 'running' as const,
        };
        await sessionOperations.updateSession(updatedSession);
      }
    },
    updateSessionDuration: async (id: string, duration: number) => {
      const session = sessions.find((s) => s.id === id);
      if (session) {
        const updatedSession = {
          ...session,
          sessionDuration: duration,
        };
        await sessionOperations.updateSession(updatedSession);
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
        await sessionOperations.updateSession(updatedSession);
      }
    },
    setFilters,
    addHand: async (sessionId: string, hand: Omit<HandData, 'id' | 'createdAt'>) => {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        if (hand.tableId) {
          await sessionOperations.tableHandHandlers.addTableHand(sessionId, hand.tableId, hand);
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
        
        await sessionOperations.updateSession(updatedSession);
      }
    },
    updateHand: async (sessionId: string, hand: HandData) => {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        if (hand.tableId) {
          await sessionOperations.tableHandHandlers.updateTableHand(sessionId, hand.tableId, hand);
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
          
          await sessionOperations.updateSession(updatedSession);
        }
      }
    },
    deleteHand: async (sessionId: string, handId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        if (session.tables && session.tables.length > 0) {
          for (const table of session.tables) {
            if (table.hands && table.hands.some(h => h.id === handId)) {
              await sessionOperations.tableHandHandlers.deleteTableHand(sessionId, table.id, handId);
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
          
          await sessionOperations.updateSession(updatedSession);
        }
      }
    },
    addTableHand: sessionOperations.tableHandHandlers.addTableHand,
    updateTableHand: sessionOperations.tableHandHandlers.updateTableHand,
    deleteTableHand: sessionOperations.tableHandHandlers.deleteTableHand,
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
        
        await sessionOperations.updateSession(updatedSession);
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
        
        await sessionOperations.updateSession(updatedSession);
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
        
        await sessionOperations.updateSession(updatedSession);
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
        
        await sessionOperations.updateSession(updatedSession);
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
          
          await sessionOperations.updateSession(updatedSession);
        }
      }
    },
    clearAllUserData,
    refreshSessionsFromDatabase,
  } : {
    ...defaultContextValue,
    isLoading: isLoadingFromDatabase,
  };

  // Always provide the context, but show loading UI when not initialized
  return (
    <SessionContext.Provider value={contextValue}>
      {!isInitialized ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isLoadingFromDatabase ? 'Loading your sessions...' : 'Initializing...'}
            </p>
          </div>
        </div>
      ) : (
        children
      )}
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
