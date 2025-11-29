
import { supabase } from '@/integrations/supabase/client';
import { PokerSession } from '@/types/poker';
import { convertDatabaseSessionToPokerSession } from './sessionConverter';

// Cache authenticated user to avoid redundant auth calls within same request cycle
let cachedUserId: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 30000; // 30 seconds cache

const getAuthenticatedUserId = async (): Promise<string | null> => {
  const now = Date.now();
  
  // Use cached value if still valid
  if (cachedUserId && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedUserId;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    cachedUserId = user.id;
    cacheTimestamp = now;
  } else {
    cachedUserId = null;
    cacheTimestamp = 0;
  }
  return user?.id || null;
};

// Export function to clear cache (call on logout)
export const clearAuthCache = () => {
  cachedUserId = null;
  cacheTimestamp = 0;
};

export const fetchUserSessions = async (): Promise<PokerSession[]> => {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.error('❌ No authenticated user found');
      return [];
    }

    console.log('🔄 Fetching user sessions for user:', userId);

    // Fast path: use disambiguated FK for embedded query
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        session_tables(*),
        session_hands_new!fk_session_hands_session_id(*)
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (sessionError) {
      console.warn('⚠️ Embedded query failed, using fallback stitching:', {
        message: sessionError.message,
        code: sessionError.code
      });

      // Fallback: fetch separately and stitch in memory
      const { data: baseSessions, error: baseError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (baseError) {
        console.error('❌ Fallback base sessions fetch failed:', baseError);
        return [];
      }

      if (!baseSessions || baseSessions.length === 0) {
        console.log('📋 No sessions found in database for user:', userId);
        return [];
      }

      const ids = baseSessions.map((s: any) => s.id);

      const [{ data: tables, error: tablesError }, { data: hands, error: handsError }] = await Promise.all([
        supabase.from('session_tables').select('*').in('session_id', ids).eq('user_id', userId),
        supabase.from('session_hands_new').select('*').in('session_id', ids).eq('user_id', userId)
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
      console.log('📋 No sessions found in database for user:', userId);
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
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.error('❌ No authenticated user found');
      return [];
    }

    console.log('🔄 Fetching active sessions');

    // Fast path: use disambiguated FK for embedded query
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        session_tables(*),
        session_hands_new!fk_session_hands_session_id(*)
      `)
      .eq('is_active', true)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (sessionError) {
      console.warn('⚠️ Embedded active sessions query failed, using fallback:', {
        message: sessionError.message,
        code: sessionError.code
      });

      // Fallback: fetch separately and stitch in memory
      const { data: baseSessions, error: baseError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
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
        supabase.from('session_tables').select('*').in('session_id', ids).eq('user_id', userId),
        supabase.from('session_hands_new').select('*').in('session_id', ids).eq('user_id', userId)
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

// Optimized: Direct query for single active session instead of fetching all
export const fetchActiveSession = async (): Promise<PokerSession | null> => {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return null;
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        *,
        session_tables(*),
        session_hands_new!fk_session_hands_session_id(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ Direct active session query failed, using fallback');
      const activeSessions = await fetchActiveSessions();
      return activeSessions.length > 0 ? activeSessions[0] : null;
    }

    if (!session) {
      return null;
    }

    return convertDatabaseSessionToPokerSession(
      session,
      session.session_tables || [],
      session.session_hands_new || []
    );
  } catch (error) {
    console.error('❌ Failed to fetch active session:', error);
    return null;
  }
};
