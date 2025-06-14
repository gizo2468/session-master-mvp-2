
import { supabase } from '@/integrations/supabase/client';
import { PokerSession } from '@/types/poker';

export interface DatabaseSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  game_type: string;
  format: string;
  location: string | null;
  physical_location: string | null;
  table_name: string | null;
  buy_in: number;
  initial_buy_in: number;
  cash_out: number | null;
  small_blind: number;
  big_blind: number;
  rebuys: number;
  rebuy_amount: number;
  session_duration: number;
  is_active: boolean;
  is_online: boolean;
  current_status: string;
  starting_bb: number | null;
  tournament_types: string[] | null;
  is_multi_day: boolean;
  roi: number;
  itm_ratio_numerator: number;
  itm_ratio_denominator: number;
  tables_played: number;
  notes: string | null;
  status: string;
  created_at: string;
}

export class SessionPersistenceService {
  static async startSession(sessionData: {
    gameType: string;
    format: string;
    location: string;
    physicalLocation?: string;
    tableName?: string;
    buyIn: number;
    smallBlind: number;
    bigBlind: number;
    isOnline: boolean;
    startingBB?: number;
    tournamentTypes?: string[];
    isMultiDay: boolean;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('start_session', {
        p_game_type: sessionData.gameType,
        p_format: sessionData.format,
        p_location: sessionData.location,
        p_physical_location: sessionData.physicalLocation || null,
        p_table_name: sessionData.tableName || null,
        p_buy_in: sessionData.buyIn,
        p_small_blind: sessionData.smallBlind,
        p_big_blind: sessionData.bigBlind,
        p_is_online: sessionData.isOnline,
        p_starting_bb: sessionData.startingBB || null,
        p_tournament_types: sessionData.tournamentTypes || null,
        p_is_multi_day: sessionData.isMultiDay
      });

      if (error) {
        console.error('Error starting session:', error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.error('Error in startSession:', error);
      return null;
    }
  }

  static async endSession(
    sessionId: string,
    cashOut: number,
    notes?: string,
    roi?: number,
    itmRatioNumerator?: number,
    itmRatioDenominator?: number,
    tablesPlayed?: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('end_session', {
        p_session_id: sessionId,
        p_cash_out: cashOut,
        p_notes: notes || null,
        p_roi: roi || 0,
        p_itm_ratio_numerator: itmRatioNumerator || 0,
        p_itm_ratio_denominator: itmRatioDenominator || 0,
        p_tables_played: tablesPlayed || 0
      });

      if (error) {
        console.error('Error ending session:', error);
        return false;
      }

      return data as boolean;
    } catch (error) {
      console.error('Error in endSession:', error);
      return false;
    }
  }

  static async fetchUserSessions(): Promise<PokerSession[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      if (!data) return [];

      // Convert database sessions to PokerSession format
      return data.map(this.convertDatabaseSessionToPokerSession);
    } catch (error) {
      console.error('Error in fetchUserSessions:', error);
      return [];
    }
  }

  static async updateSession(session: PokerSession): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          game_type: session.gameType,
          format: session.format,
          location: session.location,
          physical_location: session.physicalLocation,
          table_name: session.tableName,
          buy_in: session.buyIn,
          initial_buy_in: session.initialBuyIn,
          cash_out: session.cashOut,
          small_blind: session.smallBlind,
          big_blind: session.bigBlind,
          rebuys: session.rebuys,
          rebuy_amount: session.rebuyAmount,
          session_duration: session.sessionDuration,
          is_active: session.isActive,
          is_online: session.isOnline,
          current_status: session.currentStatus,
          starting_bb: session.startingBB,
          tournament_types: session.tournamentTypes,
          is_multi_day: session.isMultiDay,
          roi: session.roi,
          itm_ratio_numerator: session.itmRatioNumerator,
          itm_ratio_denominator: session.itmRatioDenominator,
          tables_played: session.tablesPlayed,
          notes: session.notes,
          status: session.status || 'active'
        })
        .eq('id', session.id);

      if (error) {
        console.error('Error updating session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSession:', error);
      return false;
    }
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return false;
    }
  }

  private static convertDatabaseSessionToPokerSession(dbSession: DatabaseSession): PokerSession {
    return {
      id: dbSession.id,
      gameType: dbSession.game_type as any,
      format: dbSession.format as any,
      location: dbSession.location || '',
      physicalLocation: dbSession.physical_location,
      tableName: dbSession.table_name,
      buyIn: Number(dbSession.buy_in),
      initialBuyIn: Number(dbSession.initial_buy_in),
      cashOut: dbSession.cash_out ? Number(dbSession.cash_out) : undefined,
      smallBlind: Number(dbSession.small_blind),
      bigBlind: Number(dbSession.big_blind),
      rebuys: dbSession.rebuys,
      rebuyAmount: Number(dbSession.rebuy_amount),
      sessionDuration: dbSession.session_duration,
      isActive: dbSession.is_active,
      isOnline: dbSession.is_online,
      currentStatus: dbSession.current_status as any,
      startingBB: dbSession.starting_bb,
      tournamentTypes: dbSession.tournament_types,
      isMultiDay: dbSession.is_multi_day,
      roi: Number(dbSession.roi),
      itmRatioNumerator: dbSession.itm_ratio_numerator,
      itmRatioDenominator: dbSession.itm_ratio_denominator,
      tablesPlayed: dbSession.tables_played,
      notes: dbSession.notes,
      status: dbSession.status as any,
      startTime: new Date(dbSession.start_time),
      endTime: dbSession.end_time ? new Date(dbSession.end_time) : undefined,
      hands: [], // Will be loaded separately if needed
      tables: [] // Will be loaded separately if needed
    };
  }
}
