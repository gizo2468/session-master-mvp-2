import { supabase } from '@/integrations/supabase/client';
import { PokerSession, HandData, TableData } from '@/types/poker';

export interface DatabaseSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  game_type: string;
  format: string; // Changed from session_type to format
  buy_in: number;
  initial_buy_in: number;
  cash_out: number;
  small_blind: number;
  big_blind: number;
  location: string;
  table_name: string;
  is_active: boolean;
  is_online: boolean;
  current_status: string;
  session_duration: number;
  rebuys: number;
  rebuy_amount: number; // Add missing property
  starting_bb: number | null; // Add missing property
  tournament_types: string[] | null; // Add missing property
  is_multi_day: boolean; // Add missing property
  roi: number; // Add missing property
  itm_ratio_numerator: number; // Add missing property
  itm_ratio_denominator: number; // Add missing property
  tables_played: number; // Add missing property
  notes: string | null;
  status: string; // Add missing property
  email: string | null;
  created_at: string;
}

export interface DatabaseTable {
  id: string;
  session_id: string;
  user_id: string;
  table_name: string;
  game_format: string;
  table_type: string;
  buy_in: number;
  cashout: number;
  stakes: string;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
  rebuys: number;
  bounty_amount: number;
  final_position: number | null;
  table_notes: string | null;
  starting_stack: number | null;
  current_stack: number | null;
  rebuy_amount: number | null;
  players_eliminated: number | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseHand {
  id: string;
  session_id: string;
  user_id: string;
  table_id: string | null;
  hand_number: number | null;
  position: string | null;
  hole_cards: string | null;
  preflop_action: string | null;
  flop_cards: string | null;
  flop_action: string | null;
  turn_card: string | null;
  turn_action: string | null;
  river_card: string | null;
  river_action: string | null;
  showdown_result: string | null;
  pot_size: number;
  amount_invested: number;
  amount_won: number;
  currency_type: string;
  hand_notes: string | null;
  hand_image: string | null;
  created_at: string;
  updated_at: string;
}

// Convert database session to PokerSession
export const convertDatabaseSessionToPokerSession = (
  dbSession: DatabaseSession,
  tables: DatabaseTable[] = [],
  hands: DatabaseHand[] = []
): PokerSession => {
  // Convert database tables to TableData
  const convertedTables: TableData[] = tables.map(table => ({
    id: table.id,
    name: table.table_name,
    gameType: table.table_type as any,
    format: table.game_format as any,
    location: '', // Default location for tables
    buyIn: Number(table.buy_in),
    initialBuyIn: Number(table.buy_in),
    cashOut: table.cashout ? Number(table.cashout) : undefined,
    smallBlind: 0, // Will be derived from stakes
    bigBlind: 0, // Will be derived from stakes
    startTime: new Date(table.start_time),
    endTime: table.end_time ? new Date(table.end_time) : undefined,
    isActive: table.is_active,
    isOnline: false,
    rebuys: table.rebuys,
    bountyAmount: Number(table.bounty_amount),
    finalPosition: table.final_position,
    notes: table.table_notes || undefined,
    stakes: table.stakes,
    startingStack: table.starting_stack || undefined,
    currentStack: table.current_stack || undefined,
    rebuyAmount: table.rebuy_amount || undefined,
    hands: hands
      .filter(hand => hand.table_id === table.id)
      .map(hand => ({
        id: hand.id,
        cards: hand.hole_cards ? JSON.parse(hand.hole_cards)[0] || '' : '',
        action: hand.preflop_action || '',
        position: hand.position || '',
        tableId: hand.table_id || undefined,
        handNumber: hand.hand_number || undefined,
        holeCards: hand.hole_cards ? JSON.parse(hand.hole_cards) : undefined,
        preflopAction: hand.preflop_action || undefined,
        flopCards: hand.flop_cards ? JSON.parse(hand.flop_cards) : undefined,
        flopAction: hand.flop_action || undefined,
        turnCard: hand.turn_card || undefined,
        turnAction: hand.turn_action || undefined,
        riverCard: hand.river_card || undefined,
        riverAction: hand.river_action || undefined,
        showdownResult: hand.showdown_result || undefined,
        result: hand.showdown_result || undefined,
        potSize: Number(hand.pot_size),
        amountInvested: Number(hand.amount_invested),
        amountWon: Number(hand.amount_won),
        resultAmount: Number(hand.amount_won),
        currencyType: hand.currency_type as any,
        notes: hand.hand_notes || undefined,
        handImage: hand.hand_image || undefined,
        image: hand.hand_image || undefined,
        createdAt: new Date(hand.created_at)
      }))
  }));

  // Convert session-level hands (not associated with a table)
  const sessionHands: HandData[] = hands
    .filter(hand => !hand.table_id)
    .map(hand => ({
      id: hand.id,
      cards: hand.hole_cards ? JSON.parse(hand.hole_cards)[0] || '' : '',
      action: hand.preflop_action || '',
      position: hand.position || '',
      handNumber: hand.hand_number || undefined,
      holeCards: hand.hole_cards ? JSON.parse(hand.hole_cards) : undefined,
      preflopAction: hand.preflop_action || undefined,
      flopCards: hand.flop_cards ? JSON.parse(hand.flop_cards) : undefined,
      flopAction: hand.flop_action || undefined,
      turnCard: hand.turn_card || undefined,
      turnAction: hand.turn_action || undefined,
      riverCard: hand.river_card || undefined,
      riverAction: hand.river_action || undefined,
      showdownResult: hand.showdown_result || undefined,
      result: hand.showdown_result || undefined,
      potSize: Number(hand.pot_size),
      amountInvested: Number(hand.amount_invested),
      amountWon: Number(hand.amount_won),
      resultAmount: Number(hand.amount_won),
      currencyType: hand.currency_type as any,
      notes: hand.hand_notes || undefined,
      handImage: hand.hand_image || undefined,
      image: hand.hand_image || undefined,
      createdAt: new Date(hand.created_at)
    }));

  return {
    id: dbSession.id,
    gameType: dbSession.game_type as any,
    format: dbSession.format as any, // Use format instead of session_type
    location: dbSession.location,
    buyIn: Number(dbSession.buy_in),
    initialBuyIn: Number(dbSession.initial_buy_in),
    cashOut: dbSession.cash_out ? Number(dbSession.cash_out) : undefined,
    smallBlind: Number(dbSession.small_blind),
    bigBlind: Number(dbSession.big_blind),
    tableName: dbSession.table_name,
    isActive: dbSession.is_active,
    isOnline: dbSession.is_online,
    currentStatus: dbSession.current_status as any,
    sessionDuration: dbSession.session_duration,
    rebuys: dbSession.rebuys,
    rebuyAmount: Number(dbSession.rebuy_amount),
    startingBB: dbSession.starting_bb,
    tournamentTypes: dbSession.tournament_types,
    isMultiDay: dbSession.is_multi_day,
    roi: Number(dbSession.roi),
    itmRatioNumerator: dbSession.itm_ratio_numerator,
    itmRatioDenominator: dbSession.itm_ratio_denominator,
    tablesPlayed: dbSession.tables_played,
    startTime: new Date(dbSession.start_time),
    endTime: dbSession.end_time ? new Date(dbSession.end_time) : undefined,
    notes: dbSession.notes || undefined,
    status: dbSession.status as any,
    hands: sessionHands,
    tables: convertedTables
  };
};

// Convert PokerSession to database format
export const convertPokerSessionToDatabase = (session: PokerSession) => {
  return {
    id: session.id,
    start_time: session.startTime.toISOString(),
    end_time: session.endTime?.toISOString() || null,
    game_type: session.gameType,
    format: session.format, // Use format instead of session_type
    buy_in: session.buyIn,
    initial_buy_in: session.initialBuyIn || session.buyIn,
    cash_out: session.cashOut || 0,
    small_blind: session.smallBlind || 0,
    big_blind: session.bigBlind || 0,
    location: session.location || '',
    table_name: session.tableName || '',
    is_active: session.isActive,
    is_online: session.isOnline || false,
    current_status: session.currentStatus || 'ended',
    session_duration: session.sessionDuration || 0,
    rebuys: session.rebuys || 0,
    rebuy_amount: session.rebuyAmount || 0,
    starting_bb: session.startingBB,
    tournament_types: session.tournamentTypes,
    is_multi_day: session.isMultiDay,
    roi: session.roi || 0,
    itm_ratio_numerator: session.itmRatioNumerator || 0,
    itm_ratio_denominator: session.itmRatioDenominator || 0,
    tables_played: session.tablesPlayed || 0,
    notes: session.notes || null,
    status: session.status || 'active',
    email: null // Will be set by RLS
  };
};

// NEW: Fetch active session specifically
export const fetchActiveSession = async (): Promise<PokerSession | null> => {
  try {
    console.log('🔍 Fetching active session from database...');
    
    // Fetch active session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('is_active', true)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        // No active session found
        console.log('📋 No active session found in database');
        return null;
      }
      console.error('❌ Error fetching active session:', sessionError);
      throw sessionError;
    }

    if (!session) {
      console.log('📋 No active session found in database');
      return null;
    }

    console.log('✅ Found active session in database:', session.id);

    // Fetch tables for this session
    const { data: tables, error: tablesError } = await supabase
      .from('session_tables')
      .select('*')
      .eq('session_id', session.id);

    if (tablesError) {
      console.error('❌ Error fetching tables for active session:', tablesError);
    }

    // Fetch hands for this session
    const { data: hands, error: handsError } = await supabase
      .from('session_hands_new')
      .select('*')
      .eq('session_id', session.id);

    if (handsError) {
      console.error('❌ Error fetching hands for active session:', handsError);
    }

    // Convert to PokerSession format
    const convertedSession = convertDatabaseSessionToPokerSession(
      session as any,
      (tables || []) as DatabaseTable[],
      (hands || []) as DatabaseHand[]
    );

    console.log('✅ Successfully converted active session');
    return convertedSession;
  } catch (error) {
    console.error('❌ Failed to fetch active session from database:', error);
    return null;
  }
};

// Fetch all sessions for the current user
export const fetchUserSessions = async (): Promise<PokerSession[]> => {
  try {
    console.log('🔍 Fetching sessions from database...');
    
    // Fetch sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('start_time', { ascending: false });

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      console.log('📋 No sessions found in database');
      return [];
    }

    console.log(`✅ Found ${sessions.length} sessions in database`);

    // Fetch all tables for these sessions
    const sessionIds = sessions.map(s => s.id);
    const { data: tables, error: tablesError } = await supabase
      .from('session_tables')
      .select('*')
      .in('session_id', sessionIds);

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
      // Continue without tables if they fail to load
    }

    // Fetch all hands for these sessions
    const { data: hands, error: handsError } = await supabase
      .from('session_hands_new')
      .select('*')
      .in('session_id', sessionIds);

    if (handsError) {
      console.error('❌ Error fetching hands:', handsError);
      // Continue without hands if they fail to load
    }

    // Convert to PokerSession format
    const convertedSessions = sessions.map(session => {
      const sessionTables = (tables || []).filter(table => table.session_id === session.id) as DatabaseTable[];
      const sessionHands = (hands || []).filter(hand => hand.session_id === session.id) as DatabaseHand[];
      
      return convertDatabaseSessionToPokerSession(
        session as any, // Type assertion to handle the conversion
        sessionTables,
        sessionHands
      );
    });

    console.log(`✅ Successfully converted ${convertedSessions.length} sessions`);
    return convertedSessions;
  } catch (error) {
    console.error('❌ Failed to fetch sessions from database:', error);
    throw error;
  }
};

// Save session to database
export const saveSessionToDatabase = async (session: PokerSession): Promise<boolean> => {
  try {
    console.log('💾 Saving session to database:', session.id);
    
    const dbSession = convertPokerSessionToDatabase(session);
    
    const { error } = await supabase
      .from('sessions')
      .upsert(dbSession, { onConflict: 'id' });

    if (error) {
      console.error('❌ Error saving session:', error);
      return false;
    }

    // Save tables if they exist
    if (session.tables && session.tables.length > 0) {
      const dbTables = session.tables.map(table => ({
        id: table.id,
        session_id: session.id,
        user_id: undefined, // Will use DEFAULT auth.uid()
        table_name: table.name || '',
        game_format: table.format,
        table_type: table.gameType,
        buy_in: table.buyIn,
        cashout: table.cashOut || 0,
        stakes: table.stakes || '',
        start_time: table.startTime.toISOString(),
        end_time: table.endTime?.toISOString() || null,
        is_active: table.isActive,
        rebuys: table.rebuys || 0,
        bounty_amount: table.bountyAmount || 0,
        final_position: table.finalPosition || null,
        table_notes: table.notes || null,
        starting_stack: table.startingStack || null,
        current_stack: table.currentStack || null,
        rebuy_amount: table.rebuyAmount || null,
        players_eliminated: 0
      }));

      const { error: tablesError } = await supabase
        .from('session_tables')
        .upsert(dbTables, { onConflict: 'id' });

      if (tablesError) {
        console.error('❌ Error saving tables:', tablesError);
      }
    }

    // Save session-level hands
    if (session.hands && session.hands.length > 0) {
      const sessionHands = session.hands.map(hand => ({
        id: hand.id,
        session_id: session.id,
        user_id: undefined, // Will use DEFAULT auth.uid()
        table_id: null,
        hand_number: hand.handNumber || null,
        position: hand.position || null,
        hole_cards: hand.holeCards ? JSON.stringify(hand.holeCards) : null,
        preflop_action: hand.preflopAction || null,
        flop_cards: hand.flopCards ? JSON.stringify(hand.flopCards) : null,
        flop_action: hand.flopAction || null,
        turn_card: hand.turnCard || null,
        turn_action: hand.turnAction || null,
        river_card: hand.riverCard || null,
        river_action: hand.riverAction || null,
        showdown_result: hand.showdownResult || null,
        pot_size: hand.potSize || 0,
        amount_invested: hand.amountInvested || 0,
        amount_won: hand.amountWon || 0,
        currency_type: hand.currencyType || 'currency',
        hand_notes: hand.notes || null,
        hand_image: hand.handImage || null,
        created_at: hand.createdAt.toISOString()
      }));

      const { error: handsError } = await supabase
        .from('session_hands_new')
        .upsert(sessionHands, { onConflict: 'id' });

      if (handsError) {
        console.error('❌ Error saving session hands:', handsError);
      }
    }

    // Save table-level hands
    if (session.tables) {
      for (const table of session.tables) {
        if (table.hands && table.hands.length > 0) {
          const tableHands = table.hands.map(hand => ({
            id: hand.id,
            session_id: session.id,
            user_id: undefined, // Will use DEFAULT auth.uid()
            table_id: table.id,
            hand_number: hand.handNumber || null,
            position: hand.position || null,
            hole_cards: hand.holeCards ? JSON.stringify(hand.holeCards) : null,
            preflop_action: hand.preflopAction || null,
            flop_cards: hand.flopCards ? JSON.stringify(hand.flopCards) : null,
            flop_action: hand.flopAction || null,
            turn_card: hand.turnCard || null,
            turn_action: hand.turnAction || null,
            river_card: hand.riverCard || null,
            river_action: hand.riverAction || null,
            showdown_result: hand.showdownResult || null,
            pot_size: hand.potSize || 0,
            amount_invested: hand.amountInvested || 0,
            amount_won: hand.amountWon || 0,
            currency_type: hand.currencyType || 'currency',
            hand_notes: hand.notes || null,
            hand_image: hand.handImage || null,
            created_at: hand.createdAt.toISOString()
          }));

          const { error: tableHandsError } = await supabase
            .from('session_hands_new')
            .upsert(tableHands, { onConflict: 'id' });

          if (tableHandsError) {
            console.error('❌ Error saving table hands:', tableHandsError);
          }
        }
      }
    }

    console.log('✅ Session saved to database successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to save session to database:', error);
    return false;
  }
};

// Delete session from database
export const deleteSessionFromDatabase = async (sessionId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting session from database:', sessionId);
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Error deleting session:', error);
      return false;
    }

    console.log('✅ Session deleted from database successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete session from database:', error);
    return false;
  }
};
