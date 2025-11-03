
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

    console.log('🔄 Fetching user sessions for user:', user.id);

    // Fast path: try single-embed query
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        session_tables(*),
        session_hands_new(*)
      `)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (sessionError) {
      console.warn('⚠️ Embedded query failed, using fallback stitching:', {
        message: sessionError.message,
        details: sessionError.details,
        hint: sessionError.hint,
        code: sessionError.code
      });

      // Fallback: fetch separately and stitch in memory
      const { data: baseSessions, error: baseError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (baseError) {
        console.error('❌ Fallback base sessions fetch failed:', baseError);
        return [];
      }

      if (!baseSessions || baseSessions.length === 0) {
        console.log('📋 No sessions found in database for user:', user.id);
        return [];
      }

      const ids = baseSessions.map((s: any) => s.id);

      const [{ data: tables, error: tablesError }, { data: hands, error: handsError }] = await Promise.all([
        supabase.from('session_tables').select('*').in('session_id', ids).eq('user_id', user.id),
        supabase.from('session_hands_new').select('*').in('session_id', ids).eq('user_id', user.id)
      ]);

      if (tablesError || handsError) {
        console.error('❌ Fallback related data fetch failed:', { tablesError, handsError });
        return [];
      }

      const tablesBySession = new Map<string, any[]>();
      const handsBySession = new Map<string, any[]>();

      (tables || []).forEach((t: any) => {
        const arr = tablesBySession.get(t.session_id) || [];
        arr.push(t);
        tablesBySession.set(t.session_id, arr);
      });
      (hands || []).forEach((h: any) => {
        const arr = handsBySession.get(h.session_id) || [];
        arr.push(h);
        handsBySession.set(h.session_id, arr);
      });

      console.log(`🧵 Fallback stitched ${baseSessions.length} sessions, ${(tables||[]).length} tables, ${(hands||[]).length} hands`);

      const stitched: PokerSession[] = baseSessions.map((s: any) =>
        convertDatabaseSessionToPokerSession(
          s,
          tablesBySession.get(s.id) || [],
          handsBySession.get(s.id) || []
        )
      );

      return stitched;
    }

    if (!sessions || sessions.length === 0) {
      console.log('📋 No sessions found in database for user:', user.id);
      return [];
    }

    console.log(`✅ Fetched ${sessions.length} sessions (embedded)`);

    const pokerSessions: PokerSession[] = sessions.map((session: any) => {
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

    console.log('🔄 Fetching active sessions');

    // Fast path: try single-embed query
    const { data: sessions, error: sessionError } = await supabase
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
      console.warn('⚠️ Embedded active sessions query failed, using fallback:', {
        message: sessionError.message,
        details: sessionError.details,
        hint: sessionError.hint,
        code: sessionError.code
      });

      // Fallback: fetch separately and stitch in memory
      const { data: baseSessions, error: baseError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('start_time', { ascending: false });

      if (baseError) {
        console.error('❌ Fallback base active sessions fetch failed:', baseError);
        return [];
      }

      if (!baseSessions || baseSessions.length === 0) {
        console.log('📋 No active sessions found');
        return [];
      }

      const ids = baseSessions.map((s: any) => s.id);

      const [{ data: tables, error: tablesError }, { data: hands, error: handsError }] = await Promise.all([
        supabase.from('session_tables').select('*').in('session_id', ids).eq('user_id', user.id),
        supabase.from('session_hands_new').select('*').in('session_id', ids).eq('user_id', user.id)
      ]);

      if (tablesError || handsError) {
        console.error('❌ Fallback related data fetch for active sessions failed:', { tablesError, handsError });
        return [];
      }

      const tablesBySession = new Map<string, any[]>();
      const handsBySession = new Map<string, any[]>();

      (tables || []).forEach((t: any) => {
        const arr = tablesBySession.get(t.session_id) || [];
        arr.push(t);
        tablesBySession.set(t.session_id, arr);
      });
      (hands || []).forEach((h: any) => {
        const arr = handsBySession.get(h.session_id) || [];
        arr.push(h);
        handsBySession.set(h.session_id, arr);
      });

      console.log(`🧵 Fallback stitched active: ${baseSessions.length} sessions, ${(tables||[]).length} tables, ${(hands||[]).length} hands`);

      const stitched: PokerSession[] = baseSessions.map((s: any) =>
        convertDatabaseSessionToPokerSession(
          s,
          tablesBySession.get(s.id) || [],
          handsBySession.get(s.id) || []
        )
      );

      return stitched;
    }

    if (!sessions || sessions.length === 0) {
      console.log('📋 No active sessions found');
      return [];
    }

    console.log(`✅ Found ${sessions.length} active sessions`);

    const activeSessions: PokerSession[] = sessions.map((session: any) => {
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
