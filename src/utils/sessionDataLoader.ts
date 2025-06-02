
import { supabase } from '@/integrations/supabase/client';
import { SessionData, TableData, HandData } from '@/types/poker';

export const loadSessionFromSupabase = async (sessionId: string): Promise<SessionData | null> => {
  try {
    console.log('🔍 Loading session from Supabase:', sessionId);

    // Load main session data
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('❌ Session not found:', sessionError);
      return null;
    }

    // Load session tables
    const { data: sessionTables, error: tablesError } = await supabase
      .from('session_tables')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (tablesError) {
      console.error('❌ Error loading session tables:', tablesError);
      return null;
    }

    // Load session hands
    const { data: sessionHands, error: handsError } = await supabase
      .from('session_hands')
      .select('*')
      .eq('session_id', sessionId)
      .order('hand_number', { ascending: true });

    if (handsError) {
      console.error('❌ Error loading session hands:', handsError);
    }

    // Transform to frontend format
    const tables: TableData[] = (sessionTables || []).map(table => {
      const tableHands = (sessionHands || [])
        .filter(hand => hand.table_id === table.id)
        .map(hand => ({
          id: hand.id,
          tableId: hand.table_id || '',
          handNumber: hand.hand_number || 0,
          holeCards: hand.hole_cards || '',
          position: hand.position || '',
          potSize: Number(hand.pot_size) || 0,
          amountWon: Number(hand.amount_won) || 0,
          amountInvested: Number(hand.amount_invested) || 0,
          notes: hand.hand_notes || '',
          preflop: {
            action: hand.preflop_action || '',
          },
          flop: {
            cards: hand.flop_cards || '',
            action: hand.flop_action || '',
          },
          turn: {
            card: hand.turn_card || '',
            action: hand.turn_action || '',
          },
          river: {
            card: hand.river_card || '',
            action: hand.river_action || '',
          },
          showdown: hand.showdown_result || '',
          image: hand.hand_image || '',
          currencyType: hand.currency_type || 'currency',
        } as HandData));

      return {
        id: table.id,
        name: table.table_name || 'Unknown Table',
        format: (table.game_format === 'Tournament' ? 'Tournament' : 'Cash') as 'Cash' | 'Tournament',
        gameType: table.table_type || 'Hold\'em',
        stakes: table.stakes || '',
        location: '', // Add required location field
        smallBlind: 0,
        bigBlind: 0,
        buyIn: Number(table.buy_in) || 0,
        startingStack: Number(table.starting_stack) || 0,
        currentStack: Number(table.current_stack) || 0,
        rebuys: Number(table.rebuys) || 0,
        rebuyAmount: Number(table.rebuy_amount) || 0,
        cashout: Number(table.cashout) || 0,
        finalPosition: table.final_position || undefined,
        playersEliminated: Number(table.players_eliminated) || 0,
        bountyAmount: Number(table.bounty_amount) || 0,
        notes: table.table_notes || '',
        isActive: table.is_active || false,
        startTime: new Date(table.start_time || Date.now()),
        endTime: table.end_time ? new Date(table.end_time) : undefined,
        hands: tableHands,
      } as TableData;
    });

    const sessionData: SessionData = {
      id: session.id,
      user_id: session.user_id,
      startTime: new Date(session.start_time),
      endTime: new Date(session.end_time),
      gameType: session.game_type || '',
      sessionType: session.session_type || '',
      notes: session.notes || '',
      tables,
    };

    console.log('✅ Session loaded successfully:', sessionData);
    return sessionData;

  } catch (error) {
    console.error('❌ Error loading session from Supabase:', error);
    return null;
  }
};

export const validateSessionAccess = async (sessionId: string, userId: string): Promise<boolean> => {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return false;
    }

    return session.user_id === userId;
  } catch (error) {
    console.error('❌ Error validating session access:', error);
    return false;
  }
};
