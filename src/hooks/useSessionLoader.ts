
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { PokerSession } from '@/types/poker';
import { supabase } from '@/integrations/supabase/client';
import { convertDatabaseSessionToPokerSession } from '@/utils/database';

export const useSessionLoader = (id: string | undefined) => {
  const navigate = useNavigate();
  const { sessions, activeSession, updateSession } = useSessionContext();
  const { toast } = useToast();
  
  const [currentSession, setCurrentSession] = useState<PokerSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoadingError(null);
        setIsLoadingSession(true);
        
        if (!id) {
          console.log('❌ No session ID provided');
          setLoadingError('No session ID provided');
          navigate('/');
          return;
        }

        console.log('🔍 Looking for session:', id);

        // First try to find session in context with validation
        let foundSession = activeSession?.id === id ? activeSession : sessions.find(s => s.id === id);
        
        if (foundSession) {
          // Validate session data before using
          if (!foundSession.startTime || !foundSession.gameType || !foundSession.format) {
            console.warn('⚠️ Session found but missing required data, reloading from database');
            foundSession = null; // Force database reload
          } else if (!foundSession.isActive) {
            console.warn('⚠️ Session found but not active:', foundSession.id);
            toast({
              title: "Session Ended",
              description: "This session has already been completed.",
              variant: "destructive"
            });
            navigate('/');
            return;
          } else {
            console.log('✅ Found valid active session in context:', foundSession.id);
            setCurrentSession(foundSession);
            setIsLoadingSession(false);
            return;
          }
        }

        // If not found in context or invalid, try to load from database with timeout
        console.log('🔍 Loading session from database:', id);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 10000)
        );
        
        const queryPromise = Promise.all([
          supabase
            .from('sessions')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .maybeSingle(),
          supabase
            .from('session_tables')
            .select('*')
            .eq('session_id', id),
          supabase
            .from('session_hands_new')
            .select('*')
            .eq('session_id', id)
        ]);

        const [sessionResult, tablesResult, handsResult] = await Promise.race([
          queryPromise,
          timeoutPromise
        ]) as any;

        if (sessionResult.error) {
          console.error('❌ Database error loading session:', sessionResult.error);
          throw new Error(`Database error: ${sessionResult.error.message}`);
        }

        if (!sessionResult.data) {
          console.error('❌ Session not found in database or not active');
          setLoadingError('Session not found or has ended');
          toast({
            title: "Session Not Found",
            description: "The session you're looking for doesn't exist or has ended.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        // Validate required database fields
        const sessionData = sessionResult.data;
        if (!sessionData.start_time || !sessionData.game_type || !sessionData.format) {
          console.error('❌ Session data incomplete:', sessionData);
          throw new Error('Session data is incomplete or corrupted');
        }

        // Get related data (don't fail if these are missing)
        const tables = tablesResult.error ? [] : (tablesResult.data || []);
        const hands = handsResult.error ? [] : (handsResult.data || []);

        if (tablesResult.error) {
          console.warn('⚠️ Error fetching tables:', tablesResult.error);
        }
        if (handsResult.error) {
          console.warn('⚠️ Error fetching hands:', handsResult.error);
        }

        // Convert to PokerSession format with validation
        const convertedSession = convertDatabaseSessionToPokerSession(
          sessionData,
          tables,
          hands
        );

        // Final validation
        if (!convertedSession.id || !convertedSession.startTime) {
          throw new Error('Session conversion resulted in invalid data');
        }

        console.log('✅ Session loaded and converted successfully');
        setCurrentSession(convertedSession);
        
        // Update the session context with the loaded session (don't wait for this)
        updateSession(convertedSession).catch(error => {
          console.warn('⚠️ Failed to update session context:', error);
        });
        
      } catch (error) {
        console.error('❌ Failed to load session:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setLoadingError(`Failed to load session: ${errorMessage}`);
        
        toast({
          title: "Error Loading Session",
          description: "There was a problem loading your session. Please try again.",
          variant: "destructive"
        });
        
        // Navigate back after a short delay to show the error message
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } finally {
        setIsLoadingSession(false);
      }
    };

    // Only load if we have an ID
    if (id) {
      loadSession();
    } else {
      setIsLoadingSession(false);
    }
  }, [id, navigate, toast, updateSession]); // Fixed dependency array

  return { currentSession, isLoadingSession, loadingError };
};
