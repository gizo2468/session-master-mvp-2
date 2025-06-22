
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
        
        if (!id) {
          console.log('No session ID provided');
          navigate('/');
          return;
        }

        // First try to find session in context
        let foundSession = activeSession?.id === id ? activeSession : sessions.find(s => s.id === id && s.isActive);
        
        if (foundSession) {
          // Double-check that the session is actually active
          if (!foundSession.isActive) {
            console.warn('Session found but not active:', foundSession.id);
            toast({
              title: "Session Ended",
              description: "This session has already been completed.",
              variant: "destructive"
            });
            navigate('/');
            return;
          }
          
          console.log('✅ Found active session in context:', foundSession.id);
          setCurrentSession(foundSession);
          setIsLoadingSession(false);
          return;
        }

        // If not found in context, try to load from database
        console.log('🔍 Loading session from database:', id);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (sessionError || !sessionData) {
          console.error('❌ Session not found or not active:', sessionError);
          setLoadingError('Session not found or has ended');
          toast({
            title: "Session Not Found",
            description: "The session you're looking for doesn't exist or has ended.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        // Fetch tables for this session
        const { data: tables, error: tablesError } = await supabase
          .from('session_tables')
          .select('*')
          .eq('session_id', id);

        if (tablesError) {
          console.error('❌ Error fetching tables:', tablesError);
        }

        // Fetch hands for this session
        const { data: hands, error: handsError } = await supabase
          .from('session_hands_new')
          .select('*')
          .eq('session_id', id);

        if (handsError) {
          console.error('❌ Error fetching hands:', handsError);
        }

        // Convert to PokerSession format
        const convertedSession = convertDatabaseSessionToPokerSession(
          sessionData as any,
          (tables || []) as any[],
          (hands || []) as any[]
        );

        console.log('✅ Session loaded from database successfully');
        setCurrentSession(convertedSession);
        
        // Update the session context with the loaded session
        await updateSession(convertedSession);
        
      } catch (error) {
        console.error('❌ Failed to load session from database:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setLoadingError(`Failed to load session: ${errorMessage}`);
        
        toast({
          title: "Error Loading Session",
          description: "There was a problem loading your session. Please try again.",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSession();
  }, [id, activeSession, sessions, navigate, toast, updateSession]);

  return { currentSession, isLoadingSession, loadingError };
};
