
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

  // Load active session from database with timeout and error handling
  const loadActiveSessionFromDatabase = async (userId: string | null) => {
    if (!userId) return null;
    
    try {
      console.log('🔄 Loading active session from database for user:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Active session fetch timeout')), 8000)
      );
      
      const activeSession = await Promise.race([
        fetchActiveSession(),
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

  // Load sessions from database with fallback to localStorage and timeout
  const loadSessionsFromSources = async (userId: string | null) => {
    setIsLoadingFromDatabase(true);
    let loadedSessions: PokerSession[] = [];
    let loadedActiveSession: PokerSession | null = null;

    if (userId) {
      try {
        console.log('🔄 Loading sessions from database for user:', userId);
        
        // Add timeout to prevent hanging on slow queries
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sessions fetch timeout')), 10000)
        );
        
        const [activeSessionResult, sessionsResult] = await Promise.allSettled([
          Promise.race([loadActiveSessionFromDatabase(userId), timeoutPromise]),
          Promise.race([fetchUserSessions(), timeoutPromise])
        ]);
        
        // Handle active session result
        if (activeSessionResult.status === 'fulfilled') {
          loadedActiveSession = activeSessionResult.value as PokerSession | null;
        }
        
        // Handle sessions result
        if (sessionsResult.status === 'fulfilled') {
          loadedSessions = sessionsResult.value as PokerSession[];
          console.log(`✅ Loaded ${loadedSessions.length} sessions from database`);
        } else {
          console.error('❌ Failed to load sessions from database:', sessionsResult.reason);
          throw new Error('Database query failed');
        }
        
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
          
          // Show warning about database connectivity
          toast({
            title: "Offline Mode",
            description: "Using locally stored data. Database connectivity issues detected.",
            variant: "destructive"
          });
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

  // Enhanced session refresh function with timeout and error handling
  const refreshSessionsFromDatabase = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Refreshing sessions from database');
      setIsLoadingFromDatabase(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Refresh timeout')), 8000)
      );
      
      const [sessionsResult, activeSessionResult] = await Promise.allSettled([
        Promise.race([fetchUserSessions(), timeoutPromise]),
        Promise.race([loadActiveSessionFromDatabase(user.id), timeoutPromise])
      ]);
      
      let databaseSessions: PokerSession[] = [];
      let freshActiveSession: PokerSession | null = null;
      
      if (sessionsResult.status === 'fulfilled') {
        databaseSessions = sessionsResult.value as PokerSession[];
        console.log(`✅ Refreshed ${databaseSessions.length} sessions from database`);
      }
      
      if (activeSessionResult.status === 'fulfilled') {
        freshActiveSession = activeSessionResult.value as PokerSession | null;
      }
      
      setSessions(databaseSessions);
      setActiveSession(freshActiveSession);
      
    } catch (error) {
      console.error('❌ Failed to refresh sessions from database:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh sessions from database. Using local data.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingFromDatabase(false);
    }
  };

  // Initialize sessions on mount and when user changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const initializeSessions = async () => {
      try {
        console.log('🔄 User changed, reinitializing sessions. User:', user?.id);
        
        // Set timeout for initialization (15 seconds max)
        timeoutId = setTimeout(() => {
          console.error('❌ Session initialization timeout');
          setInitializationError('Initialization timeout. Please refresh the page.');
          setIsInitialized(true);
        }, 15000);
        
        if (currentUserId !== user?.id) {
          console.log('👤 User switch detected, clearing sessions');
          
          setSessions([]);
          setActiveSession(null);
          setInitializationError(null);
          
          if (!user) {
            clearUserData(currentUserId);
            setCurrentUserId(null);
            clearTimeout(timeoutId);
            setIsInitialized(true);
            return;
          }
          
          setCurrentUserId(user.id);
          clearOtherUserSessions(user.id);
        }
        
        const loadedSessions = await loadSessionsFromSources(user?.id || null);
        console.log('📋 Loaded sessions for user:', user?.id, 'Count:', loadedSessions.length);
        
        setSessions(loadedSessions);
        clearTimeout(timeoutId);
        setIsInitialized(true);
        
      } catch (error) {
        console.error('❌ Failed to initialize sessions:', error);
        setInitializationError('Failed to initialize session data. Please refresh the page.');
        clearTimeout(timeoutId);
        setIsInitialized(true);
      }
    };

    initializeSessions();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id, currentUserId]);

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
