
import { useState, useEffect } from 'react';
import { PokerSession } from '@/types/poker';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { loadSessions, findActiveSession, clearUserData, clearOtherUserSessions } from './storage';
import { fetchUserSessions, fetchActiveSession } from '@/utils/database';

export const useSessionInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessions, setSessions] = useState<PokerSession[]>([]);
  const [activeSession, setActiveSession] = useState<PokerSession | null>(null);
  const [isLoadingFromDatabase, setIsLoadingFromDatabase] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load active session from database with error handling and timeout
  const loadActiveSessionFromDatabase = async (userId: string | null) => {
    if (!userId) return null;
    
    try {
      console.log('🔄 Loading active session from database for user:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 8000)
      );
      
      const activeSessionPromise = fetchActiveSession();
      
      const activeSession = await Promise.race([
        activeSessionPromise,
        timeoutPromise
      ]) as PokerSession | null;
      
      if (activeSession) {
        console.log('✅ Found active session:', activeSession.id);
        return activeSession;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to load active session from database:', error);
      return null;
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
        
        // Add timeout to prevent database operations from hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 10000)
        );
        
        const databasePromise = Promise.all([
          loadActiveSessionFromDatabase(userId),
          fetchUserSessions()
        ]);
        
        const [activeSessionResult, databaseSessions] = await Promise.race([
          databasePromise,
          timeoutPromise
        ]) as [PokerSession | null, PokerSession[]];
        
        loadedActiveSession = activeSessionResult;
        loadedSessions = databaseSessions;
        
        console.log(`✅ Loaded ${loadedSessions.length} sessions from database`);
        
        if (loadedActiveSession) {
          setActiveSession(loadedActiveSession);
        } else {
          const foundActiveSession = findActiveSession(loadedSessions);
          setActiveSession(foundActiveSession);
        }
      } catch (error) {
        console.error('❌ Failed to load from database, falling back to localStorage:', error);
        
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

  // Enhanced session refresh function with error handling and timeout
  const refreshSessionsFromDatabase = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Refreshing sessions from database');
      setIsLoadingFromDatabase(true);
      
      // Add timeout for refresh operations
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database refresh timeout')), 8000)
      );
      
      const refreshPromise = Promise.all([
        fetchUserSessions(),
        loadActiveSessionFromDatabase(user.id)
      ]);
      
      const [databaseSessions, freshActiveSession] = await Promise.race([
        refreshPromise,
        timeoutPromise
      ]) as [PokerSession[], PokerSession | null];
      
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

  // Initialize sessions on mount and when user changes
  useEffect(() => {
    const initializeSessions = async () => {
      try {
        console.log('🔄 User changed, reinitializing sessions. User:', user?.id);
        
        if (currentUserId !== user?.id) {
          console.log('👤 User switch detected, clearing sessions');
          
          setSessions([]);
          setActiveSession(null);
          setInitializationError(null);
          
          if (!user) {
            clearUserData(currentUserId);
            setCurrentUserId(null);
            setIsInitialized(true);
            return;
          }
          
          setCurrentUserId(user.id);
          clearOtherUserSessions(user.id);
        }
        
        const loadedSessions = await loadSessionsFromSources(user?.id || null);
        console.log('📋 Loaded sessions for user:', user?.id, 'Count:', loadedSessions.length);
        
        setSessions(loadedSessions);
        setIsInitialized(true);
        
      } catch (error) {
        console.error('❌ Failed to initialize sessions:', error);
        setInitializationError('Failed to initialize session data. Please refresh the page.');
        setIsInitialized(true);
      }
    };

    initializeSessions();
  }, [user?.id, currentUserId, toast]);

  return {
    isInitialized,
    sessions,
    setSessions,
    activeSession,
    setActiveSession,
    isLoadingFromDatabase,
    initializationError,
    currentUserId,
    refreshSessionsFromDatabase
  };
};
