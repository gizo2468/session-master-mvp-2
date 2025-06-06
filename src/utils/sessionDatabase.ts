
import { supabase } from '@/integrations/supabase/client';
import { PokerSession, HandData, TableData } from '@/types/poker';

export interface DatabaseSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  game_type: string;
  session_type: string;
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
  add_ons: number;
  tournament_buy_in: number;
  bounty_count: number;
  bounty_amount: number;
  final_position: number | null;
  notes: string | null;
  email: string | null;
  created_at: string;
}

export interface DatabaseTable {
  id: string;
  session_id: string;
  table_name: string;
  game_type: string;
  format: string;
  buy_in: number;
  initial_buy_in: number;
  cash_out: number;
  small_blind: number;
  big_blind: number;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
  is_online: boolean;
  rebuys: number;
  bounty_count: number;
  bounty_amount: number;
  final_position: number | null;
  notes: string | null;
  next_day_start: string | null;
  chips_carryover: number | null;
  day_ended_without_elimination: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseHand {
  id: string;
  session_id: string;
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
    gameType: table.game_type as any,
    format: table.format as any,
    buyIn: Number(table.buy_in),
    initialBuyIn: Number(table.initial_buy_in),
    cashOut: table.cash_out ? Number(table.cash_out) : undefined,
    smallBlind: Number(table.small_blind),
    bigBlind: Number(table.big_blind),
    startTime: new Date(table.start_time),
    endTime: table.end_time ? new Date(table.end_time) : undefined,
    isActive: table.is_active,
    isOnline: table.is_online,
    rebuys: table.rebuys,
    bountyCount: table.bounty_count,
    bountyAmount: Number(table.bounty_amount),
    finalPosition: table.final_position,
    notes: table.notes || undefined,
    nextDayStart: table.next_day_start ? new Date(table.next_day_start) : undefined,
    chipsCarryover: table.chips_carryover || undefined,
    dayEndedWithoutElimination: table.day_ended_without_elimination,
    hands: hands
      .filter(hand => hand.table_id === table.id)
      .map(hand => ({
        id: hand.id,
        tableId: hand.table_id || undefined,
        handNumber: hand.hand_number || undefined,
        position: hand.position || undefined,
        holeCards: hand.hole_cards ? JSON.parse(hand.hole_cards) : undefined,
        preflopAction: hand.preflop_action || undefined,
        flopCards: hand.flop_cards ? JSON.parse(hand.flop_cards) : undefined,
        flopAction: hand.flop_action || undefined,
        turnCard: hand.turn_card || undefined,
        turnAction: hand.turn_action || undefined,
        riverCard: hand.river_card || undefined,
        riverAction: hand.river_action || undefined,
        showdownResult: hand.showdown_result || undefined,
        potSize: Number(hand.pot_size),
        amountInvested: Number(hand.amount_invested),
        amountWon: Number(hand.amount_won),
        currencyType: hand.currency_type as any,
        notes: hand.hand_notes || undefined,
        handImage: hand.hand_image || undefined,
        createdAt: new Date(hand.created_at)
      }))
  }));

  // Convert session-level hands (not associated with a table)
  const sessionHands: HandData[] = hands
    .filter(hand => !hand.table_id)
    .map(hand => ({
      id: hand.id,
      handNumber: hand.hand_number || undefined,
      position: hand.position || undefined,
      holeCards: hand.hole_cards ? JSON.parse(hand.hole_cards) : undefined,
      preflopAction: hand.preflop_action || undefined,
      flopCards: hand.flop_cards ? JSON.parse(hand.flop_cards) : undefined,
      flopAction: hand.flop_action || undefined,
      turnCard: hand.turn_card || undefined,
      turnAction: hand.turn_action || undefined,
      riverCard: hand.river_card || undefined,
      riverAction: hand.river_action || undefined,
      showdownResult: hand.showdown_result || undefined,
      potSize: Number(hand.pot_size),
      amountInvested: Number(hand.amount_invested),
      amountWon: Number(hand.amount_won),
      currencyType: hand.currency_type as any,
      notes: hand.hand_notes || undefined,
      handImage: hand.hand_image || undefined,
      createdAt: new Date(hand.created_at)
    }));

  return {
    id: dbSession.id,
    gameType: dbSession.game_type as any,
    format: dbSession.session_type as any,
    buyIn: Number(dbSession.buy_in),
    initialBuyIn: Number(dbSession.initial_buy_in),
    cashOut: dbSession.cash_out ? Number(dbSession.cash_out) : undefined,
    smallBlind: Number(dbSession.small_blind),
    bigBlind: Number(dbSession.big_blind),
    location: dbSession.location,
    tableName: dbSession.table_name,
    isActive: dbSession.is_active,
    isOnline: dbSession.is_online,
    currentStatus: dbSession.current_status as any,
    sessionDuration: dbSession.session_duration,
    rebuys: dbSession.rebuys,
    addOns: dbSession.add_ons,
    tournamentBuyIn: Number(dbSession.tournament_buy_in),
    bountyCount: dbSession.bounty_count,
    bountyAmount: Number(dbSession.bounty_amount),
    finalPosition: dbSession.final_position || undefined,
    startTime: new Date(dbSession.start_time),
    endTime: dbSession.end_time ? new Date(dbSession.end_time) : undefined,
    notes: dbSession.notes || undefined,
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
    session_type: session.format,
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
    add_ons: session.addOns || 0,
    tournament_buy_in: session.tournamentBuyIn || 0,
    bounty_count: session.bountyCount || 0,
    bounty_amount: session.bountyAmount || 0,
    final_position: session.finalPosition || null,
    notes: session.notes || null,
    email: null // Will be set by RLS
  };
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
      const sessionTables = (tables || []).filter(table => table.session_id === session.id);
      const sessionHands = (hands || []).filter(hand => hand.session_id === session.id);
      
      return convertDatabaseSessionToPokerSession(
        session as DatabaseSession,
        sessionTables as DatabaseTable[],
        sessionHands as DatabaseHand[]
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
        table_name: table.name,
        game_type: table.gameType,
        format: table.format,
        buy_in: table.buyIn,
        initial_buy_in: table.initialBuyIn || table.buyIn,
        cash_out: table.cashOut || 0,
        small_blind: table.smallBlind || 0,
        big_blind: table.bigBlind || 0,
        start_time: table.startTime.toISOString(),
        end_time: table.endTime?.toISOString() || null,
        is_active: table.isActive,
        is_online: table.isOnline || false,
        rebuys: table.rebuys || 0,
        bounty_count: table.bountyCount || 0,
        bounty_amount: table.bountyAmount || 0,
        final_position: table.finalPosition || null,
        notes: table.notes || null,
        next_day_start: table.nextDayStart?.toISOString() || null,
        chips_carryover: table.chipsCarryover || null,
        day_ended_without_elimination: table.dayEndedWithoutElimination || false
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
