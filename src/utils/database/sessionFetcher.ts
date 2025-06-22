
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

    console.log('🔍 Fetching sessions for user:', user.id);

    // Optimized single query with batch processing
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        session_tables!inner(*),
        session_hands_new(*)
      `)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (sessionError) {
      console.error('❌ Error fetching sessions:', sessionError);
      return [];
    }

    if (!sessions || sessions.length === 0) {
      console.log('📋 No sessions found for user');
      return [];
    }

    console.log(`✅ Found ${sessions.length} sessions, converting...`);

    const pokerSessions: PokerSession[] = [];

    // Process sessions in batches to avoid blocking
    for (const session of sessions) {
      try {
        // Extract related data from the joined query
        const tables = session.session_tables || [];
        const hands = session.session_hands_new || [];

        // Convert to PokerSession format
        const pokerSession = convertDatabaseSessionToPokerSession(
          session,
          tables,
          hands
        );

        pokerSessions.push(pokerSession);
      } catch (conversionError) {
        console.error('❌ Error converting session:', session.id, conversionError);
        // Continue with other sessions
      }
    }

    console.log(`✅ Successfully converted ${pokerSessions.length} sessions`);
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

    console.log('🔍 Fetching active sessions for user:', user.id);

    // Optimized query for active sessions only
    const { data: sessionsData, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        session_tables(*),
        session_hands_new(*)
      `)
      .eq('is_active', true)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (sessionError) {
      console.error('❌ Error fetching active sessions:', sessionError);
      return [];
    }

    if (!sessionsData || sessionsData.length === 0) {
      console.log('📋 No active sessions found');
      return [];
    }

    console.log(`✅ Found ${sessionsData.length} active sessions`);

    const activeSessions: PokerSession[] = [];

    for (const sessionData of sessionsData) {
      try {
        // Extract related data from the joined query
        const tables = sessionData.session_tables || [];
        const hands = sessionData.session_hands_new || [];

        // Convert to PokerSession format
        const pokerSession = convertDatabaseSessionToPokerSession(
          sessionData,
          tables,
          hands
        );

        activeSessions.push(pokerSession);
      } catch (conversionError) {
        console.error('❌ Error converting active session:', sessionData.id, conversionError);
        // Continue with other sessions
      }
    }

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
