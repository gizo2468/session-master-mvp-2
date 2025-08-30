import { supabase } from '@/integrations/supabase/client';

export interface BBStackUpdateRecord {
  id: string;
  user_id: string;
  session_id: string;
  table_id: string;
  level?: number;
  bb?: number;
  stack?: number;
  small_blind?: number;
  big_blind?: number;
  created_at: string;
}

export class BBStackUpdateService {
  static async createUpdate(data: {
    sessionId: string;
    tableId: string;
    level?: number;
    bb?: number;
    stack?: number;
    smallBlind?: number;
    bigBlind?: number;
  }): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('table_bb_stack_updates')
        .insert({
          user_id: user.id,
          session_id: data.sessionId,
          table_id: data.tableId,
          level: data.level,
          bb: data.bb,
          stack: data.stack,
          small_blind: data.smallBlind,
          big_blind: data.bigBlind,
        });

      if (error) {
        console.error('Error creating BB/Stack update:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createUpdate:', error);
      return false;
    }
  }

  static async getUpdateHistory(sessionId: string, tableId: string): Promise<BBStackUpdateRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('table_bb_stack_updates')
        .select('*')
        .eq('session_id', sessionId)
        .eq('table_id', tableId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching BB/Stack update history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUpdateHistory:', error);
      return [];
    }
  }

  static async getSessionUpdateHistory(sessionId: string): Promise<Record<string, BBStackUpdateRecord[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {};
      }

      const { data, error } = await supabase
        .from('table_bb_stack_updates')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching session BB/Stack update history:', error);
        return {};
      }

      // Group by table_id
      const grouped: Record<string, BBStackUpdateRecord[]> = {};
      data?.forEach(record => {
        if (!grouped[record.table_id]) {
          grouped[record.table_id] = [];
        }
        grouped[record.table_id].push(record);
      });

      return grouped;
    } catch (error) {
      console.error('Error in getSessionUpdateHistory:', error);
      return {};
    }
  }
}