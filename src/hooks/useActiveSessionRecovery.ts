
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PokerSession } from '@/types/poker';
import { convertDatabaseSessionToPokerSession } from '@/utils/sessionDatabase';

export const useActiveSessionRecovery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<PokerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkForActiveSession = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 Checking for active session in database...');
        
        // Query for active session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('is_active', true)
          .eq('user_id', user.id)
          .order('start_time', { ascending: false })
          .limit(1)
          .single();

        if (sessionError && sessionError.code !== 'PGRST116') {
          console.error('❌ Error fetching active session:', sessionError);
          setIsLoading(false);
          return;
        }

        if (!sessionData) {
          console.log('📋 No active session found');
          setActiveSession(null);
          setIsLoading(false);
          return;
        }

        console.log('✅ Found active session:', sessionData.id);

        // Fetch tables for this session
        const { data: tables, error: tablesError } = await supabase
          .from('session_tables')
          .select('*')
          .eq('session_id', sessionData.id);

        if (tablesError) {
          console.error('❌ Error fetching tables:', tablesError);
        }

        // Fetch hands for this session
        const { data: hands, error: handsError } = await supabase
          .from('session_hands_new')
          .select('*')
          .eq('session_id', sessionData.id);

        if (handsError) {
          console.error('❌ Error fetching hands:', handsError);
        }

        // Convert to PokerSession format
        const convertedSession = convertDatabaseSessionToPokerSession(
          sessionData as any,
          (tables || []) as any[],
          (hands || []) as any[]
        );

        setActiveSession(convertedSession);
        console.log('✅ Active session loaded successfully');
      } catch (error) {
        console.error('❌ Failed to check for active session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkForActiveSession();
  }, [user]);

  const resumeSession = () => {
    if (activeSession) {
      navigate(`/live-session/${activeSession.id}`);
    }
  };

  return {
    activeSession,
    isLoading,
    resumeSession,
    hasActiveSession: !!activeSession
  };
};
