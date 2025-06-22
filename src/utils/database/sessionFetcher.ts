
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

    console.log('🔄 Fetching user sessions with optimized query');

    // FIXED: Use the correct foreign key constraint name we just created
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        session_tables!session_tables_session_id_fkey(*),
        session_hands_new!session_hands_new_session_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (sessionError) {
      console.error('❌ Error fetching sessions:', sessionError);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      console.log('📋 No sessions found');
      return [];
    }

    console.log(`✅ Fetched ${sessions.length} sessions with related data in single query`);

    // Convert all sessions in batch
    const pokerSessions: PokerSession[] = sessions.map(session => {
      return convertDatabaseSessionToPokerSession(
        session,
        session.session_tables || [],
        session.session_hands_new || []
      );
    });

    return pokerSessions;
  } catch (error) {
    console.error('❌ Failed to fetch user sessions:', error);
    return [];
  }
};

export const fetchActiveSessions = async (): Promise<PokerSession[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user found');
      return [];
    }

    console.log('🔄 Fetching active sessions with optimized query');

    // FIXED: Use the correct foreign key constraint name for active sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        session_tables!session_tables_session_id_fkey(*),
        session_hands_new!session_hands_new_session_id_fkey(*)
      `)
      .eq('is_active', true)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (sessionError) {
      console.error('❌ Error fetching active sessions:', sessionError);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      console.log('📋 No active sessions found');
      return [];
    }

    console.log(`✅ Found ${sessions.length} active sessions`);

    // Convert all sessions in batch
    const activeSessions: PokerSession[] = sessions.map(session => {
      return convertDatabaseSessionToPokerSession(
        session,
        session.session_tables || [],
        session.session_hands_new || []
      );
    });

    return activeSessions;
  } catch (error) {
    console.error('❌ Failed to fetch active sessions:', error);
    return [];
  }
};

export const fetchActiveSession = async (): Promise<PokerSession | null> => {
  const activeSessions = await fetchActiveSessions();
  return activeSessions.length > 0 ? activeSessions[0] : null;
};
