import { supabase } from '@/integrations/supabase/client';
import { PokerSession } from '@/types/poker';

export const fetchUserSessions = async (): Promise<PokerSession[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user found');
      return [];
    }

    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (sessionError) {
      console.error('❌ Error fetching sessions:', sessionError);
      return [];
    }

    const pokerSessions: PokerSession[] = [];

    for (const session of sessions) {
      // Fetch tables for this session
      const { data: tables, error: tablesError } = await supabase
        .from('session_tables')
        .select('*')
        .eq('session_id', session.id);

      if (tablesError) {
        console.error('❌ Error fetching tables:', tablesError);
      }

      // Fetch hands for this session
      const { data: hands, error: handsError } = await supabase
        .from('session_hands_new')
        .select('*')
        .eq('session_id', session.id);

      if (handsError) {
        console.error('❌ Error fetching hands:', handsError);
      }

      // Convert to PokerSession format
      const pokerSession = convertDatabaseSessionToPokerSession(
        session,
        tables || [],
        hands || []
      );

      pokerSessions.push(pokerSession);
    }

    return pokerSessions;
  } catch (error) {
    console.error('❌ Failed to fetch user sessions:', error);
    return [];
  }
};

export const fetchActiveSession = async (): Promise<PokerSession | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user found');
      return null;
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('is_active', true)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('❌ Error fetching active session:', sessionError);
      return null;
    }

    if (!sessionData) {
      console.log('📋 No active session found');
      return null;
    }

    // Fetch tables for this session
    const { data: tables, error: tablesError } = await supabase
      .from('session_tables')
      .select('*')
      .eq('session_id', sessionData.id);

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
    }

    // Fetch hands for this session
    const { data: hands, error: handsError } = await supabase
      .from('session_hands_new')
      .select('*')
      .eq('session_id', sessionData.id);

    if (handsError) {
      console.error('❌ Error fetching hands:', handsError);
    }

    // Convert to PokerSession format
    const pokerSession = convertDatabaseSessionToPokerSession(
      sessionData,
      tables || [],
      hands || []
    );

    return pokerSession;
  } catch (error) {
    console.error('❌ Failed to fetch active session:', error);
    return null;
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

export const saveSessionToDatabase = async (session: PokerSession): Promise<boolean> => {
  try {
    console.log('💾 Saving session to database:', session.id);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user found');
      return false;
    }

    // Prepare session data for database
    const sessionData = {
      id: session.id,
      user_id: user.id,
      game_type: session.gameType,
      format: session.format,
      location: session.location,
      physical_location: session.physicalLocation,
      table_name: session.tableName,
      buy_in: session.buyIn,
      initial_buy_in: session.initialBuyIn,
      small_blind: session.smallBlind,
      big_blind: session.bigBlind,
      is_online: session.isOnline,
      starting_bb: session.startingBB,
      tournament_types: session.tournamentTypes,
      is_multi_day: session.isMultiDay,
      start_time: session.startTime.toISOString(),
      end_time: session.endTime?.toISOString(),
      cash_out: session.cashOut,
      notes: session.notes,
      status: session.isActive ? 'active' : 'completed',
      is_active: session.isActive,
      current_status: session.currentStatus,
      session_duration: session.sessionDuration,
      rebuys: session.rebuys,
      rebuy_amount: session.rebuyAmount || 0,
      roi: session.roi || 0,
      itm_ratio_numerator: session.itmRatioNumerator || 0,
      itm_ratio_denominator: session.itmRatioDenominator || 0,
      tables_played: session.tablesPlayed || 0
    };

    // Upsert session
    const { error: sessionError } = await supabase
      .from('sessions')
      .upsert(sessionData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (sessionError) {
      console.error('❌ Error saving session:', sessionError);
      return false;
    }

    // Save tables to session_tables
    if (session.tables && session.tables.length > 0) {
      console.log('💾 Saving tables to database:', session.tables.length);
      
      for (const table of session.tables) {
        const tableData = {
          id: table.id,
          session_id: session.id,
          user_id: user.id,
          table_name: table.name,
          table_type: table.format,
          game_format: table.gameType,
          buy_in: table.buyIn,
          stakes: table.smallBlind && table.bigBlind ? `${table.smallBlind}/${table.bigBlind}` : undefined,
          starting_stack: table.startingBB,
          current_stack: table.currentStack,
          is_active: table.isActive,
          start_time: table.startTime.toISOString(),
          end_time: table.endTime?.toISOString(),
          cashout: table.cashOut,
          rebuys: table.rebuys || 0,
          rebuy_amount: table.rebuyAmount || 0,
          players_eliminated: table.players_eliminated || 0,
          bounty_amount: table.bountyAmount || 0,
          final_position: table.finalPosition,
          table_notes: table.notes
        };

        const { error: tableError } = await supabase
          .from('session_tables')
          .upsert(tableData, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (tableError) {
          console.error('❌ Error saving table:', tableError);
          // Continue with other tables even if one fails
        }
      }
    }

    // Save hands to session_hands_new
    if (session.hands && session.hands.length > 0) {
      console.log('💾 Saving hands to database:', session.hands.length);
      
      for (const hand of session.hands) {
        const handData = {
          id: hand.id,
          session_id: session.id,
          user_id: user.id,
          table_id: hand.tableId,
          hand_number: hand.handNumber,
          position: hand.position,
          hole_cards: Array.isArray(hand.holeCards) ? hand.holeCards.join(',') : hand.holeCards,
          preflop_action: hand.preflopAction,
          flop_cards: Array.isArray(hand.flopCards) ? hand.flopCards.join(',') : hand.flopCards,
          flop_action: hand.flopAction,
          turn_card: hand.turnCard,
          turn_action: hand.turnAction,
          river_card: hand.riverCard,
          river_action: hand.riverAction,
          showdown_result: hand.showdownResult,
          pot_size: hand.potSize || 0,
          amount_invested: hand.amountInvested || 0,
          amount_won: hand.amountWon || 0,
          hand_notes: hand.notes,
          hand_image: hand.image,
          currency_type: hand.currencyType || 'currency',
          created_at: hand.createdAt.toISOString()
        };

        const { error: handError } = await supabase
          .from('session_hands_new')
          .upsert(handData, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (handError) {
          console.error('❌ Error saving hand:', handError);
          // Continue with other hands even if one fails
        }
      }
    }

    console.log('✅ Session saved successfully to database');
    return true;
  } catch (error) {
    console.error('❌ Failed to save session to database:', error);
    return false;
  }
};

export const convertDatabaseSessionToPokerSession = (
  sessionData: any,
  tables: any[],
  hands: any[]
): PokerSession => {
  return {
    id: sessionData.id,
    gameType: sessionData.game_type || 'NLH',
    format: sessionData.format || 'Cash',
    location: sessionData.location || '',
    physicalLocation: sessionData.physical_location,
    tableName: sessionData.table_name,
    buyIn: sessionData.buy_in || 0,
    initialBuyIn: sessionData.initial_buy_in || sessionData.buy_in || 0,
    smallBlind: sessionData.small_blind || 0,
    bigBlind: sessionData.big_blind || 0,
    isOnline: sessionData.is_online,
    startingBB: sessionData.starting_bb,
    tournamentTypes: sessionData.tournament_types,
    isMultiDay: sessionData.is_multi_day,
    startTime: new Date(sessionData.start_time),
    endTime: sessionData.end_time ? new Date(sessionData.end_time) : undefined,
    cashOut: sessionData.cash_out,
    notes: sessionData.notes,
    isActive: sessionData.is_active,
    currentStatus: sessionData.current_status,
    sessionDuration: sessionData.session_duration,
    rebuys: sessionData.rebuys,
    rebuyAmount: sessionData.rebuy_amount,
    roi: sessionData.roi,
    itmRatioNumerator: sessionData.itm_ratio_numerator,
    itmRatioDenominator: sessionData.itm_ratio_denominator,
    tablesPlayed: sessionData.tables_played,
    tables: tables.map(table => ({
      id: table.id,
      name: table.table_name || '',
      format: table.table_type || 'Cash',
      gameType: table.game_format || 'NLH',
      location: table.location || sessionData.location || '',
      buyIn: table.buy_in || 0,
      initialBuyIn: table.buy_in || 0,
      smallBlind: table.stakes ? parseFloat(table.stakes.split('/')[0]) : undefined,
      bigBlind: table.stakes ? parseFloat(table.stakes.split('/')[1]) : undefined,
      startingBB: table.starting_stack,
      currentStack: table.current_stack,
      isActive: table.is_active,
      startTime: new Date(table.start_time),
      endTime: table.end_time ? new Date(table.end_time) : undefined,
      cashOut: table.cashout,
      rebuys: table.rebuys,
      rebuyAmount: table.rebuy_amount,
      playersEliminated: table.players_eliminated,
      bountyAmount: table.bounty_amount,
      finalPosition: table.final_position,
      notes: table.table_notes,
      session_id: table.session_id,
      hands: []
    })),
    hands: hands.map(hand => ({
      id: hand.id,
      tableId: hand.table_id,
      handNumber: hand.hand_number,
      position: hand.position,
      cards: hand.hole_cards || '',
      action: hand.preflop_action || '',
      holeCards: hand.hole_cards ? hand.hole_cards.split(',') : [],
      preflopAction: hand.preflop_action,
      flopCards: hand.flop_cards ? hand.flop_cards.split(',') : [],
      flopAction: hand.flop_action,
      turnCard: hand.turn_card,
      turnAction: hand.turn_action,
      riverCard: hand.river_card,
      riverAction: hand.river_action,
      showdownResult: hand.showdown_result,
      potSize: hand.pot_size,
      amountInvested: hand.amount_invested,
      amountWon: hand.amount_won,
      notes: hand.hand_notes,
      image: hand.hand_image,
      currencyType: hand.currency_type,
      createdAt: new Date(hand.created_at)
    }))
  };
};
