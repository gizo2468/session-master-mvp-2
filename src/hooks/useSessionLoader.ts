
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { PokerSession } from '@/types/poker';
import { supabase } from '@/integrations/supabase/client';
import { convertDatabaseSessionToPokerSession } from '@/utils/database';

export const useSessionLoader = (id: string | undefined) => {
  const navigate = useNavigate();
  const { sessions, activeSession } = useSessionContext();
  const { toast } = useToast();
  
  const [currentSession, setCurrentSession] = useState<PokerSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;

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
        
        if (foundSession?.isActive && foundSession.startTime && foundSession.gameType && foundSession.format) {
          console.log('✅ Found valid active session in context:', foundSession.id);
          if (!isCancelled) {
            setCurrentSession(foundSession);
            setIsLoadingSession(false);
          }
          return;
        }

        // If not found in context or invalid, try to load from database
        console.log('🔍 Loading session from database:', id);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select(`
            *,
            session_tables(*),
            session_hands_new(*)
          `)
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (isCancelled) return;

        if (sessionError) {
          console.error('❌ Database error loading session:', sessionError);
          throw new Error(`Database error: ${sessionError.message}`);
        }

        if (!sessionData) {
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
        if (!sessionData.start_time || !sessionData.game_type || !sessionData.format) {
          console.error('❌ Session data incomplete:', sessionData);
          throw new Error('Session data is incomplete or corrupted');
        }

        // Convert to PokerSession format
        const convertedSession = convertDatabaseSessionToPokerSession(
          sessionData,
          sessionData.session_tables || [],
          sessionData.session_hands_new || []
        );

        // Validate converted session
        if (!convertedSession.id || !convertedSession.startTime) {
          throw new Error('Session conversion resulted in invalid data');
        }

        console.log('✅ Session loaded and converted successfully');
        if (!isCancelled) {
          setCurrentSession(convertedSession);
        }
        
      } catch (error) {
        if (isCancelled) return;
        
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
          if (!isCancelled) {
            navigate('/');
          }
        }, 2000);
      } finally {
        if (!isCancelled) {
          setIsLoadingSession(false);
        }
      }
    };

    // Set up timeout for stuck loading (10 seconds)
    timeoutId = setTimeout(() => {
      if (!isCancelled && isLoadingSession) {
        console.error('❌ Session loading timeout');
        setLoadingError('Session loading timeout - please try again');
        setIsLoadingSession(false);
        toast({
          title: "Loading Timeout",
          description: "Session loading took too long. Please try again.",
          variant: "destructive"
        });
        navigate('/');
      }
    }, 10000);

    // Only load if we have an ID
    if (id) {
      loadSession();
    }

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [id, navigate, toast]); // Removed sessions, activeSession, and updateSession to prevent infinite loops

  return { currentSession, isLoadingSession, loadingError };
};
