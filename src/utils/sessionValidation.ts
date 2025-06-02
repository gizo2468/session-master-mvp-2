
import { supabase } from '@/integrations/supabase/client';
import { PokerSession } from '@/types/poker';

export interface SessionValidationResult {
  exists: boolean;
  hasPermission: boolean;
  sessionData?: any;
  errorType?: 'not_found' | 'permission_denied' | 'network_error';
  errorMessage?: string;
}

export const validateSessionAccess = async (
  sessionId: string, 
  userId: string, 
  mode: 'student' | 'coach' = 'student',
  studentId?: string
): Promise<SessionValidationResult> => {
  try {
    console.log('🔍 Validating session access:', { sessionId, userId, mode, studentId });

    // First check if session exists at all
    const { data: sessionExists, error: existsError } = await supabase
      .from('sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (existsError || !sessionExists) {
      console.log('❌ Session does not exist:', existsError);
      return {
        exists: false,
        hasPermission: false,
        errorType: 'not_found',
        errorMessage: 'This session does not exist or has been deleted.'
      };
    }

    console.log('✅ Session exists:', sessionExists);

    // Check permissions based on mode
    if (mode === 'student') {
      // Student mode: user must own the session
      if (sessionExists.user_id !== userId) {
        return {
          exists: true,
          hasPermission: false,
          errorType: 'permission_denied',
          errorMessage: 'You do not have permission to view this session.'
        };
      }
    } else if (mode === 'coach') {
      // Coach mode: must have approved connection with session owner
      const targetStudentId = studentId || sessionExists.user_id;
      
      const { data: connection, error: connectionError } = await supabase
        .from('coach_student_connections')
        .select('id')
        .eq('coach_id', userId)
        .eq('student_id', targetStudentId)
        .eq('approved', true)
        .single();

      if (connectionError || !connection) {
        return {
          exists: true,
          hasPermission: false,
          errorType: 'permission_denied',
          errorMessage: 'You do not have permission to view this student\'s session.'
        };
      }
    }

    return {
      exists: true,
      hasPermission: true,
      sessionData: sessionExists
    };

  } catch (error) {
    console.error('❌ Session validation error:', error);
    return {
      exists: false,
      hasPermission: false,
      errorType: 'network_error',
      errorMessage: 'Unable to validate session access. Please try again.'
    };
  }
};

export const syncLocalSessionToSupabase = async (localSession: PokerSession, userId: string): Promise<boolean> => {
  try {
    console.log('🔄 Syncing local session to Supabase:', localSession.id);

    // Check if session already exists
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', localSession.id)
      .single();

    if (existing) {
      console.log('✅ Session already exists in Supabase');
      return true;
    }

    // Insert session data
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        id: localSession.id,
        user_id: userId,
        start_time: localSession.startTime.toISOString(),
        end_time: localSession.endTime?.toISOString() || null,
        session_type: localSession.format,
        game_type: localSession.gameType,
        notes: localSession.notes || null
      });

    if (sessionError) {
      console.error('❌ Error syncing session:', sessionError);
      return false;
    }

    console.log('✅ Session synced to Supabase successfully');
    return true;

  } catch (error) {
    console.error('❌ Error in syncLocalSessionToSupabase:', error);
    return false;
  }
};
