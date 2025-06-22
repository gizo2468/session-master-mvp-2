
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

        // If not found in context or invalid, try to load from database
        console.log('🔍 Loading session from database:', id);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .maybeSingle();

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

        // Fetch related data with error handling
        let tables = [];
        let hands = [];

        try {
          const { data: tablesData, error: tablesError } = await supabase
            .from('session_tables')
            .select('*')
            .eq('session_id', id);

          if (tablesError) {
            console.error('⚠️ Error fetching tables:', tablesError);
            // Continue without tables - non-critical error
          } else {
            tables = tablesData || [];
          }

          const { data: handsData, error: handsError } = await supabase
            .from('session_hands_new')
            .select('*')
            .eq('session_id', id);

          if (handsError) {
            console.error('⚠️ Error fetching hands:', handsError);
            // Continue without hands - non-critical error
          } else {
            hands = handsData || [];
          }
        } catch (relatedDataError) {
          console.error('⚠️ Error fetching related data:', relatedDataError);
          // Continue with empty arrays - we can still load the session
        }

        // Convert to PokerSession format with validation
        let convertedSession;
        try {
          convertedSession = convertDatabaseSessionToPokerSession(
            sessionData as any,
            tables as any[],
            hands as any[]
          );

          // Validate converted session
          if (!convertedSession.id || !convertedSession.startTime) {
            throw new Error('Session conversion resulted in invalid data');
          }

          console.log('✅ Session loaded and converted successfully');
          setCurrentSession(convertedSession);
          
          // Update the session context with the loaded session
          try {
            await updateSession(convertedSession);
          } catch (updateError) {
            console.error('⚠️ Failed to update session context:', updateError);
            // Continue anyway - session is loaded locally
          }
          
        } catch (conversionError) {
          console.error('❌ Session conversion failed:', conversionError);
          throw new Error(`Failed to process session data: ${conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'}`);
        }
        
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

    // Only load if we have an ID and haven't loaded yet
    if (id && isLoadingSession) {
      loadSession();
    }
  }, [id, navigate, toast, updateSession]); // Removed sessions and activeSession from deps to avoid infinite loops

  return { currentSession, isLoadingSession, loadingError };
};
