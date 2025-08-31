import { supabase } from '@/integrations/supabase/client';

interface BBStackUpdate {
  id?: string;
  user_id: string;
  session_id: string;
  table_id: string;
  level?: number;
  stack?: number;
  bb?: number;
  small_blind?: number;
  big_blind?: number;
  created_at?: string;
}

export class BBStackUpdateService {
  static async saveBBStackUpdate(data: {
    sessionId: string;
    tableId: string;
    level?: number;
    stack?: string;
    bb?: string;
    smallBlind?: number;
    bigBlind?: number;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updateData: {
        user_id: string;
        session_id: string;
        table_id: string;
        level?: number;
        stack?: number;
        bb?: number;
        small_blind?: number;
        big_blind?: number;
      } = {
        user_id: user.id,
        session_id: data.sessionId,
        table_id: data.tableId,
      };

      // Add tournament fields if provided
      if (data.level !== undefined) updateData.level = data.level;
      if (data.stack && data.stack !== '') updateData.stack = parseInt(data.stack);
      if (data.bb && data.bb !== '') updateData.bb = parseInt(data.bb);

      // Add cash game fields if provided
      if (data.smallBlind !== undefined) updateData.small_blind = data.smallBlind;
      if (data.bigBlind !== undefined) updateData.big_blind = data.bigBlind;

      const { error } = await supabase
        .from('table_bb_stack_updates')
        .insert(updateData);

      if (error) {
        console.error('Error saving BB/Stack update:', error);
        throw error;
      }

      console.log('BB/Stack update saved successfully:', updateData);
    } catch (error) {
      console.error('BBStackUpdateService.saveBBStackUpdate error:', error);
      throw error;
    }
  }

  static async getBBStackHistory(tableId: string): Promise<BBStackUpdate[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('table_bb_stack_updates')
        .select('*')
        .eq('table_id', tableId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching BB/Stack history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('BBStackUpdateService.getBBStackHistory error:', error);
      throw error;
    }
  }

  static formatHistoryLine(update: BBStackUpdate, isLastUpdate: boolean = false): string {
    // For cash games
    if (update.small_blind !== undefined && update.big_blind !== undefined) {
      return `${update.small_blind}/${update.big_blind}`;
    }
    
    // For tournaments - show Level X — BB Y format
    if (update.level && update.bb) {
      return `Level ${update.level} — BB ${update.bb}`;
    }
    
    // If only level is available
    if (update.level) {
      return `Level ${update.level}`;
    }
    
    return '';
  }
}