
import { supabase } from '@/integrations/supabase/client';
import { PokerSession } from '@/types/poker';

export interface SessionStartData {
  gameType: 'NLH' | 'PLO';
  format: 'Cash' | 'Tournament';
  location: string;
  physicalLocation?: string;
  tableName?: string;
  buyIn: number;
  smallBlind?: number;
  bigBlind?: number;
  isOnline?: boolean;
  startingBB?: number;
  tournamentTypes?: string[];
  isMultiDay?: boolean;
}

export class SessionPersistenceService {
  static async startSession(sessionData: SessionStartData): Promise<string | null> {
    try {
      console.log('🎯 Starting new session with data:', sessionData);
      
      // Use the Supabase function to start a session
      const { data, error } = await supabase.rpc('start_session', {
        p_game_type: sessionData.gameType,
        p_format: sessionData.format,
        p_location: sessionData.location,
        p_physical_location: sessionData.physicalLocation || null,
        p_table_name: sessionData.tableName || sessionData.location,
        p_buy_in: sessionData.buyIn,
        p_small_blind: sessionData.smallBlind || 0,
        p_big_blind: sessionData.bigBlind || 0,
        p_is_online: sessionData.isOnline || false,
        p_starting_bb: sessionData.startingBB || null,
        p_tournament_types: sessionData.tournamentTypes || null,
        p_is_multi_day: sessionData.isMultiDay || false
      });

      if (error) {
        console.error('❌ Error starting session:', error);
        throw error;
      }

      console.log('✅ Session started successfully with ID:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      return null;
    }
  }

  static async endSession(sessionId: string, cashOut: number, notes?: string): Promise<boolean> {
    try {
      console.log('🏁 Ending session:', sessionId, 'with cashOut:', cashOut);
      
      const { data, error } = await supabase.rpc('end_session', {
        p_session_id: sessionId,
        p_cash_out: cashOut,
        p_notes: notes || null
      });

      if (error) {
        console.error('❌ Error ending session:', error);
        return false;
      }

      console.log('✅ Session ended successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Failed to end session:', error);
      return false;
    }
  }

  static async updateSessionDuration(sessionId: string, duration: number): Promise<boolean> {
    try {
      // Only update session_duration field, never start_time
      const { error } = await supabase
        .from('sessions')
        .update({ 
          session_duration: duration 
        })
        .eq('id', sessionId);

      if (error) {
        console.error('❌ Error updating session duration:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to update session duration:', error);
      return false;
    }
  }
}
