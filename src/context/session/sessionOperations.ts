
import { PokerSession, HandData, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/context/AuthContext';
import { saveSessionToDatabase, deleteSessionFromDatabase } from '@/utils/database';
import { createTableHandHandlers } from './handlers';

export const createSessionOperations = (
  sessions: PokerSession[],
  setSessions: (sessions: PokerSession[] | ((prev: PokerSession[]) => PokerSession[])) => void,
  activeSession: PokerSession | null,
  setActiveSession: (session: PokerSession | null) => void,
  user: User | null,
  toast: any,
  refreshSessionsFromDatabase: () => Promise<void>
) => {
  const updateSession = async (updatedSession: PokerSession) => {
    try {
      // Update local state immediately for better UX
      setSessions((prev) =>
        prev.map((session) =>
          session.id === updatedSession.id ? updatedSession : session
        )
      );
      
      if (activeSession && activeSession.id === updatedSession.id) {
        setActiveSession(updatedSession);
      }

      // Save to database in background with retry logic
      if (user?.id) {
        try {
          await saveSessionToDatabase(updatedSession);
          console.log('✅ Session updated successfully in database');
        } catch (error) {
          console.error('❌ Failed to update session in database:', error);
          toast({
            title: "Sync Warning",
            description: "Session updated locally but failed to sync to cloud. It will sync when connection is restored.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to update session:', error);
      throw error;
    }
  };

  const addSession = async (session: PokerSession) => {
    try {
      const sessionWithInitialBuyIn = {
        ...session,
        initialBuyIn: session.buyIn
      };

      // Add to local state immediately
      setSessions((prev) => [...prev, sessionWithInitialBuyIn]);
      
      // Save to database with proper error handling
      if (user?.id) {
        try {
          await saveSessionToDatabase(sessionWithInitialBuyIn);
          console.log('✅ Session added successfully to database');
        } catch (error) {
          console.error('❌ Failed to save new session to database:', error);
          toast({
            title: "Sync Warning",
            description: "Session saved locally but failed to sync to cloud. It will sync when connection is restored.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to add session:', error);
      throw error;
    }
  };

  const deleteSession = async (id: string) => {
    try {
      // Remove from local state immediately
      setSessions((prev) => prev.filter((session) => session.id !== id));
      
      if (activeSession && activeSession.id === id) {
        setActiveSession(null);
      }

      // Delete from database in background
      if (user?.id) {
        try {
          await deleteSessionFromDatabase(id);
          console.log('✅ Session deleted successfully from database');
        } catch (error) {
          console.error('❌ Failed to delete session from database:', error);
          toast({
            title: "Sync Warning",
            description: "Session deleted locally but failed to sync to cloud. It will sync when connection is restored.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to delete session:', error);
      throw error;
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
      
      // Set as active session immediately for better UX
      setActiveSession(sessionWithActive);
      
      // Add to sessions list
      await addSession(sessionWithActive);
      
      console.log('✅ Session started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      throw error;
    }
  };

  const endSession = async (id: string, cashOut: number, notes?: string) => {
    try {
      const session = sessions.find((s) => s.id === id);
      if (!session) {
        throw new Error('Session not found');
      }

      const hasActiveTables = session.tables && session.tables.some(table => table.isActive);
      
      if (hasActiveTables) {
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
      
      await updateSession(updatedSession);
      setActiveSession(null);
      
      console.log('✅ Session ended successfully, refreshing session list from database');
      
      // Refresh sessions from database after a short delay
      setTimeout(() => {
        refreshSessionsFromDatabase().catch(error => {
          console.error('❌ Failed to refresh sessions after ending:', error);
        });
      }, 500);
      
    } catch (error) {
      console.error('❌ Failed to end session:', error);
      throw error;
    }
  };

  // Create table hand handlers
  const tableHandHandlers = createTableHandHandlers(sessions, updateSession, user);

  return {
    addSession,
    updateSession,
    deleteSession,
    startSession,
    endSession,
    tableHandHandlers
  };
};
