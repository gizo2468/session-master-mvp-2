
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

  // Helper to determine if offline banner should be shown
  const shouldShowOfflineBanner = (error: any, hasPartialData: boolean): boolean => {
    // Don't show if we got partial data
    if (hasPartialData) return false;
    
    // Check if user is actually offline
    if (!navigator.onLine) return true;
    
    // If timeout error and user is online, don't show banner
    if (error?.message?.includes('timeout')) return false;
    
    // For other errors, show banner
    return true;
  };

  // Load active session from database with timeout and error handling
  const loadActiveSessionFromDatabase = async (userId: string | null, timeout: number = 15000) => {
    if (!userId) return null;
    
    try {
      console.log('🔄 Loading active session from database for user:', userId);
      
      // Add timeout to prevent hanging (increased to 30s)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Active session fetch timeout')), timeout)
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
      throw error;
    }
  };

  // Load sessions from database with fallback to localStorage and timeout
  const loadSessionsFromSources = async (userId: string | null) => {
    setIsLoadingFromDatabase(true);
    let loadedSessions: PokerSession[] = [];
    let loadedActiveSession: PokerSession | null = null;

    // Log localStorage state for debugging
    console.log('🔍 Checking localStorage state...');
    try {
      const localStorageKey = userId ? `pokerSessions_${userId}` : 'pokerSessions_anonymous';
      const localData = localStorage.getItem(localStorageKey);
      if (localData) {
        const parsed = JSON.parse(localData);
        console.log('📦 localStorage contains:', parsed.length, 'sessions');
      } else {
        console.log('📦 localStorage is empty for key:', localStorageKey);
      }
    } catch (e) {
      console.error('❌ Failed to read localStorage:', e);
    }

    if (userId) {
      let attemptCount = 0;
      const maxAttempts = 2;
      let lastError: any = null;
      
      while (attemptCount < maxAttempts) {
        attemptCount++;
        const isRetry = attemptCount > 1;
        const timeout = isRetry ? 25000 : 15000; // 15s first attempt, 25s retry
        
        if (isRetry) {
          console.log('⏱️ First attempt timed out, retrying with extended timeout...');
        }
        
        try {
          console.log(`🔄 Loading sessions from database for user: ${userId} (attempt ${attemptCount}/${maxAttempts})`);
          
          // Add timeout to prevent hanging on slow queries (15s first, 25s retry)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sessions fetch timeout')), timeout)
          );
          
          const [activeSessionResult, sessionsResult] = await Promise.allSettled([
            Promise.race([loadActiveSessionFromDatabase(userId, timeout), timeoutPromise]),
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
            if (loadedSessions.length > 0) {
              console.log('📋 First session details:', {
                id: loadedSessions[0].id,
                startTime: loadedSessions[0].startTime,
                isActive: loadedSessions[0].isActive,
                gameType: loadedSessions[0].gameType
              });
            }
          } else {
            console.error('❌ Failed to load sessions from database:', sessionsResult.reason);
            lastError = sessionsResult.reason;
            
            // If we have active session but sessions failed, consider it partial success
            if (loadedActiveSession) {
              console.log('⚠️ Partial success: have active session, using that');
              setActiveSession(loadedActiveSession);
              break;
            }
            
            // If not a timeout and we're online, throw to trigger fallback
            if (!lastError?.message?.includes('timeout') || !navigator.onLine) {
              throw new Error('Database query failed');
            }
            
            // If timeout and first attempt, retry
            if (attemptCount < maxAttempts) {
              continue;
            }
            
            throw new Error('Database query failed after retries');
          }
          
          // Success - set active session and break
          if (loadedActiveSession) {
            setActiveSession(loadedActiveSession);
          } else {
            const foundActiveSession = findActiveSession(loadedSessions);
            setActiveSession(foundActiveSession);
          }
          break;
          
        } catch (error) {
          lastError = error;
          
          // If this was our last attempt, handle the error
          if (attemptCount >= maxAttempts) {
            console.error('❌ Failed to load from database after retries, falling back to localStorage:', error);
            
            try {
              loadedSessions = loadSessions(userId);
              setActiveSession(findActiveSession(loadedSessions));
              console.log(`✅ Loaded ${loadedSessions.length} sessions from localStorage as fallback`);
              
              // Determine if we should show offline banner and what message
              const hasPartialData = loadedActiveSession !== null;
              if (shouldShowOfflineBanner(lastError, hasPartialData)) {
                // True offline or network error
                toast({
                  title: "Offline Mode",
                  description: "Using locally stored data. Database connectivity issues detected.",
                  variant: "destructive"
                });
              } else if (lastError?.message?.includes('timeout') && navigator.onLine) {
                // Just slow, not actually offline
                toast({
                  title: "Loading from Cache",
                  description: "Using locally stored data while connecting to database.",
                  variant: "default"
                });
              }
            } catch (localStorageError) {
              console.error('❌ Failed to load from localStorage:', localStorageError);
              setInitializationError('Failed to load session data. Please refresh the page.');
              loadedSessions = [];
              setActiveSession(null);
            }
          }
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
      
      // Add timeout to prevent hanging (15s)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Refresh timeout')), 15000)
      );
      
      const [sessionsResult, activeSessionResult] = await Promise.allSettled([
        Promise.race([fetchUserSessions(), timeoutPromise]),
        Promise.race([loadActiveSessionFromDatabase(user.id, 15000), timeoutPromise])
      ]);
      
      let databaseSessions: PokerSession[] = [];
      let freshActiveSession: PokerSession | null = null;
      let hasPartialSuccess = false;
      
      if (sessionsResult.status === 'fulfilled') {
        databaseSessions = sessionsResult.value as PokerSession[];
        console.log(`✅ Refreshed ${databaseSessions.length} sessions from database`);
        hasPartialSuccess = true;
      }
      
      if (activeSessionResult.status === 'fulfilled') {
        freshActiveSession = activeSessionResult.value as PokerSession | null;
        hasPartialSuccess = true;
      }
      
      // Only update if we got data
      if (hasPartialSuccess) {
        setSessions(databaseSessions);
        setActiveSession(freshActiveSession);
      }
      
    } catch (error) {
      console.error('❌ Failed to refresh sessions from database:', error);
      
      // Only show error if truly offline
      if (!navigator.onLine) {
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh sessions from database. Using local data.",
          variant: "destructive"
        });
      } else {
        // Just slow, don't alarm the user
        console.log('⚠️ Refresh timed out but user is online, keeping existing data');
      }
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
        
        // Set timeout for initialization (20 seconds max)
        timeoutId = setTimeout(() => {
          console.error('❌ Session initialization timeout');
          setInitializationError('Initialization timeout. Please refresh the page.');
          setIsInitialized(true);
        }, 20000);
        
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
