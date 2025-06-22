
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

    // FIXED: Update sessions state immediately
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
      // Ensure unique session ID to prevent duplicates
      let uniqueSessionId = session.id;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        // Check if session ID already exists
        const existingSession = sessions.find(s => s.id === uniqueSessionId);
        if (!existingSession) {
          break; // ID is unique
        }
        
        // Generate new ID if conflict
        uniqueSessionId = uuidv4();
        attempts++;
        console.log(`🔄 Session ID conflict, generating new ID: ${uniqueSessionId}`);
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique session ID');
      }
      
      const sessionWithActive = {
        ...session,
        id: uniqueSessionId,
        initialBuyIn: session.buyIn,
        isActive: true,
        currentStatus: 'running' as const,
        sessionDuration: 0,
        hands: [],
        tables: session.tables !== undefined ? session.tables.map(table => ({
          ...table,
          id: table.id === session.id ? uniqueSessionId + '_table_' + uuidv4() : table.id
        })) : []
      };
      
      console.log('🎯 Starting session with tables:', sessionWithActive.tables?.length || 0);
      
      // FIXED: Set active session IMMEDIATELY before adding to sessions
      setActiveSession(sessionWithActive);
      
      // FIXED: Add session to state immediately and wait for completion
      await addSession(sessionWithActive);
      
      if (user?.id) {
        try {
          console.log('💾 Immediately saving new session to database...');
          
          // Add retry logic for database save
          let saveAttempts = 0;
          const maxSaveAttempts = 3;
          let saveSuccess = false;
          
          while (saveAttempts < maxSaveAttempts && !saveSuccess) {
            try {
              await saveSessionToDatabase(sessionWithActive);
              saveSuccess = true;
              console.log('✅ Session and tables saved to database successfully');
            } catch (saveError: any) {
              saveAttempts++;
              console.error(`❌ Save attempt ${saveAttempts} failed:`, saveError);
              
              if (saveError.message?.includes('duplicate key') && saveAttempts < maxSaveAttempts) {
                // Generate new session ID and retry
                const newUniqueId = uuidv4();
                sessionWithActive.id = newUniqueId;
                sessionWithActive.tables = sessionWithActive.tables?.map(table => ({
                  ...table,
                  id: table.id.includes('_table_') ? newUniqueId + '_table_' + uuidv4() : table.id
                }));
                console.log(`🔄 Duplicate key error, retrying with new ID: ${newUniqueId}`);
                // Update the active session with new ID
                setActiveSession(sessionWithActive);
              } else if (saveAttempts >= maxSaveAttempts) {
                throw saveError;
              }
            }
          }
          
          if (!saveSuccess) {
            throw new Error('Failed to save session after multiple attempts');
          }
          
        } catch (error) {
          console.error('❌ Failed to save new session to database:', error);
          toast({
            title: "Warning",
            description: "Session created but may not sync to cloud immediately. It will sync when connection is restored.",
            variant: "destructive"
          });
        }
      }

      // FIXED: Return the session with final ID for navigation
      return sessionWithActive;
      
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
      }, 500); // Increased delay to ensure database consistency
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
