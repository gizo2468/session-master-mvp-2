
import { PokerSession, HandData, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/context/AuthContext';
import { saveSessionToDatabase, deleteSessionFromDatabase } from '@/utils/database';
import { createTableHandHandlers } from './handlers';
import { saveSessionsToSources } from './databaseSync';

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
    setSessions((prev) =>
      prev.map((session) =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
    
    if (activeSession && activeSession.id === updatedSession.id) {
      setActiveSession(updatedSession);
    }

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

  const addSession = async (session: PokerSession) => {
    const sessionWithInitialBuyIn = {
      ...session,
      initialBuyIn: session.buyIn
    };

    setSessions((prev) => [...prev, sessionWithInitialBuyIn]);
    
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

  const deleteSession = async (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
    
    if (activeSession && activeSession.id === id) {
      setActiveSession(null);
    }

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
      throw error;
    }
  };

  const endSession = async (id: string, cashOut: number, notes?: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
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
      
      console.log('🔄 Session ended, refreshing session list from database');
      setTimeout(() => {
        refreshSessionsFromDatabase();
      }, 100);
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
