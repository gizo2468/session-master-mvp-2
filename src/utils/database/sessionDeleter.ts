
import { supabase } from '@/integrations/supabase/client';

export const deleteTableFromDatabase = async (tableId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting table from database:', tableId);

    const { error } = await supabase
      .from('session_tables')
      .delete()
      .eq('id', tableId);

    if (error) {
      console.error('❌ Error deleting table:', error);
      return false;
    }

    console.log('✅ Table deleted successfully from database');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete table from database:', error);
    return false;
  }
};

export const deleteSessionFromDatabase = async (sessionId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting session from database:', sessionId);

    const { error: sessionError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionError) {
      console.error('❌ Error deleting session:', sessionError);
      return false;
    }

    console.log('✅ Session deleted successfully from database');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete session from database:', error);
    return false;
  }
};
