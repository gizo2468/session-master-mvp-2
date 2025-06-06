
import { PokerSession } from '@/types/poker';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const syncSessionToSupabase = async (session: PokerSession, user: User, toast: any) => {
  if (!user) {
    console.warn('No authenticated user - skipping Supabase sync');
    return;
  }
  
  try {
    // Sync completed sessions to Supabase - user_id and email will be set
    if (!session.isActive && session.endTime) {
      console.log('🔄 Syncing completed session to Supabase for user:', user.id, 'Email:', user.email, 'Session:', session.id);
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          start_time: session.startTime.toISOString(),
          end_time: session.endTime.toISOString(),
          session_type: session.format,
          game_type: session.gameType,
          notes: session.notes || null,
          email: user.email // Include user email for permanent identification
          // user_id will be set automatically by DEFAULT auth.uid()
        })
        .select()
        .single();

      if (sessionError) {
        console.error('❌ Error syncing session:', sessionError);
        throw sessionError;
      }

      console.log('✅ Session synced with ID:', sessionData.id, 'for user:', user.id, 'email:', user.email);
      
      toast({
        title: "Session saved to cloud",
        description: "Your session has been backed up to your account.",
      });
    } else if (session.isActive) {
      // For active sessions, save immediately to ensure they persist
      console.log('🔄 Syncing active session to Supabase for user:', user.id, 'Email:', user.email, 'Session:', session.id);
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          start_time: session.startTime.toISOString(),
          end_time: new Date().toISOString(), // Temporary end time for active sessions
          session_type: session.format,
          game_type: session.gameType,
          notes: session.notes || null,
          email: user.email // Include user email for permanent identification
          // user_id will be set automatically by DEFAULT auth.uid()
        })
        .select()
        .single();

      if (sessionError) {
        console.error('❌ Error syncing active session:', sessionError);
        throw sessionError;
      }

      console.log('✅ Active session synced with ID:', sessionData.id, 'for user:', user.id, 'email:', user.email);
    }
  } catch (error) {
    console.error("Error syncing session to Supabase:", error);
    toast({
      title: "Cloud sync failed",
      description: "Unable to save session to cloud. Your data is still saved locally.",
      variant: "destructive"
    });
  }
};
