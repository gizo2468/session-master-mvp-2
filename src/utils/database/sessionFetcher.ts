
import { supabase } from '@/integrations/supabase/client';
import { PokerSession } from '@/types/poker';
import { convertDatabaseSessionToPokerSession } from './sessionConverter';

export const fetchUserSessions = async (): Promise<PokerSession[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user found');
      return [];
    }

    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (sessionError) {
      console.error('❌ Error fetching sessions:', sessionError);
      return [];
    }

    const pokerSessions: PokerSession[] = [];

    for (const session of sessions) {
      // Fetch tables for this session
      const { data: tables, error: tablesError } = await supabase
        .from('session_tables')
        .select('*')
        .eq('session_id', session.id);

      if (tablesError) {
        console.error('❌ Error fetching tables:', tablesError);
      }

      // Fetch hands for this session
      const { data: hands, error: handsError } = await supabase
        .from('session_hands_new')
        .select('*')
        .eq('session_id', session.id);

      if (handsError) {
        console.error('❌ Error fetching hands:', handsError);
      }

      // Convert to PokerSession format
      const pokerSession = convertDatabaseSessionToPokerSession(
        session,
        tables || [],
        hands || []
      );

      pokerSessions.push(pokerSession);
    }

    return pokerSessions;
  } catch (error) {
    console.error('❌ Failed to fetch user sessions:', error);
    return [];
  }
};

export const fetchActiveSession = async (): Promise<PokerSession | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user found');
      return null;
    }

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
      return null;
    }

    if (!sessionData) {
      console.log('📋 No active session found');
      return null;
    }

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
    const pokerSession = convertDatabaseSessionToPokerSession(
      sessionData,
      tables || [],
      hands || []
    );

    return pokerSession;
  } catch (error) {
    console.error('❌ Failed to fetch active session:', error);
    return null;
  }
};
