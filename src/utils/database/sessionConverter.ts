
import { PokerSession, TableData, HandData } from '@/types/poker';

export const convertDatabaseSessionToPokerSession = (
  sessionData: any,
  tables: any[] = [],
  hands: any[] = []
): PokerSession => {
  console.log('🔧 FIXED: Converting session with proper UTC handling:', {
    sessionId: sessionData.id,
    startTime: sessionData.start_time,
    startTimeUTC: sessionData.start_time_utc,
    tablesCount: tables.length
  });

  // Convert tables - CRITICAL FIX for table persistence
  const convertedTables: TableData[] = tables.map(table => {
    console.log('🔧 FIXED: Converting table with UTC timestamps:', {
      tableId: table.id,
      tableName: table.table_name,
      startTime: table.start_time,
      startTimeUTC: table.start_time_utc,
      endTimeUTC: table.end_time_utc,
      isActive: table.is_active
    });

    return {
      id: table.id,
      name: table.table_name,
      format: table.table_type as 'Cash' | 'Tournament',
      gameType: table.game_format as 'NLH' | 'PLO',
      location: table.table_name || 'Unknown',
      buyIn: Number(table.buy_in) || 0,
      initialBuyIn: Number(table.buy_in) || 0,
      smallBlind: table.stakes ? Number(table.stakes.split('/')[0]) : undefined,
      bigBlind: table.stakes ? Number(table.stakes.split('/')[1]) : undefined,
      startingBB: table.starting_stack,
      currentStack: table.current_stack,
      isActive: table.is_active,
      startTime: new Date(table.start_time),
      startTimeUTC: table.start_time_utc ? Number(table.start_time_utc) : undefined, // CRITICAL: Preserve UTC timestamp
      endTime: table.end_time ? new Date(table.end_time) : undefined,
      endTimeUTC: table.end_time_utc ? Number(table.end_time_utc) : undefined, // CRITICAL: Preserve UTC timestamp
      cashOut: table.cashout ? Number(table.cashout) : undefined,
      rebuys: table.rebuys || 0,
      rebuyAmount: Number(table.rebuy_amount) || 0,
      bountyAmount: Number(table.bounty_amount) || 0,
      finalPosition: table.final_position,
      notes: table.table_notes,
      session_id: sessionData.id,
      hands: []
    };
  });

  // Convert hands
  const convertedHands: HandData[] = hands.map(hand => ({
    id: hand.id,
    cards: hand.hole_cards || '',
    position: hand.position || '',
    action: hand.preflop_action || '',
    notes: hand.hand_notes,
    result: hand.showdown_result,
    resultAmount: Number(hand.amount_won) || 0,
    currencyType: hand.currency_type as 'currency' | 'chips' || 'currency',
    smallBlind: undefined,
    bigBlind: undefined,
    image: hand.hand_image,
    pokercraftLink: undefined,
    createdAt: new Date(hand.created_at),
    gameType: undefined,
    tableId: hand.table_id,
    handNumber: hand.hand_number,
    holeCards: hand.hole_cards ? hand.hole_cards.split(',') : undefined,
    preflopAction: hand.preflop_action,
    flopCards: hand.flop_cards ? hand.flop_cards.split(',') : undefined,
    flopAction: hand.flop_action,
    turnCard: hand.turn_card,
    turnAction: hand.turn_action,
    riverCard: hand.river_card,
    riverAction: hand.river_action,
    showdownResult: hand.showdown_result,
    potSize: Number(hand.pot_size) || 0,
    amountWon: Number(hand.amount_won) || 0,
    amountInvested: Number(hand.amount_invested) || 0,
    handImage: hand.hand_image
  }));

  // CRITICAL FIX: Use start_time_utc from database for accurate calculations
  const session: PokerSession = {
    id: sessionData.id,
    gameType: sessionData.game_type as 'NLH' | 'PLO',
    format: sessionData.format as any,
    location: sessionData.location || 'Unknown',
    physicalLocation: sessionData.physical_location,
    tableName: sessionData.table_name,
    buyIn: Number(sessionData.buy_in) || 0,
    initialBuyIn: Number(sessionData.initial_buy_in) || Number(sessionData.buy_in) || 0,
    smallBlind: Number(sessionData.small_blind) || 0,
    bigBlind: Number(sessionData.big_blind) || 0,
    isOnline: sessionData.is_online || false,
    startingBB: sessionData.starting_bb,
    tournamentTypes: sessionData.tournament_types,
    isMultiDay: sessionData.is_multi_day || false,
    startTime: new Date(sessionData.start_time),
    startTimeUTC: sessionData.start_time_utc ? Number(sessionData.start_time_utc) : undefined, // CRITICAL: Use UTC timestamp
    endTime: sessionData.end_time ? new Date(sessionData.end_time) : undefined,
    endTimeUTC: sessionData.end_time_utc ? Number(sessionData.end_time_utc) : undefined,
    cashOut: sessionData.cash_out ? Number(sessionData.cash_out) : undefined,
    notes: sessionData.notes,
    isActive: sessionData.is_active,
    currentStatus: sessionData.current_status as 'running' | 'paused' | 'ended',
    status: sessionData.status,
    sessionDuration: sessionData.session_duration || 0,
    rebuys: sessionData.rebuys || 0,
    rebuyAmount: Number(sessionData.rebuy_amount) || 0,
    addOns: undefined,
    tournamentBuyIn: undefined,
    roi: sessionData.roi || 0,
    itmRatioNumerator: sessionData.itm_ratio_numerator || 0,
    itmRatioDenominator: sessionData.itm_ratio_denominator || 0,
    tablesPlayed: sessionData.tables_played || 0,
    tables: convertedTables, // CRITICAL: Include all converted tables
    hands: convertedHands
  };

  console.log('✅ FIXED: Session converted with all tables preserved:', {
    sessionId: session.id,
    startTime: session.startTime,
    startTimeUTC: session.startTimeUTC,
    tablesCount: session.tables?.length || 0,
    tableNames: session.tables?.map(t => t.name) || []
  });

  return session;
};
