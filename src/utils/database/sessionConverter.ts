import { PokerSession } from '@/types/poker';

// Helper function to safely parse UTC timestamps without timezone shifts
const parseUTCTimestamp = (timestamp: string | null | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  
  try {
    // Parse the timestamp and get the raw milliseconds (UTC)
    const parsedTime = Date.parse(timestamp);
    
    // If parsing failed, return undefined
    if (isNaN(parsedTime)) return undefined;
    
    // Create Date object directly from UTC milliseconds
    // This preserves the exact moment in time without timezone interpretation
    return new Date(parsedTime);
  } catch (error) {
    console.error('Error parsing timestamp:', timestamp, error);
    return undefined;
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
    // CRITICAL: Safely parse UTC timestamps to prevent invalid Date objects
    startTime: parseUTCTimestamp(sessionData.start_time) || new Date(),
    endTime: parseUTCTimestamp(sessionData.end_time),
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
      // CRITICAL: Safely parse table timestamps
      startTime: parseUTCTimestamp(table.start_time) || new Date(),
      endTime: parseUTCTimestamp(table.end_time),
      cashOut: table.cashout,
      rebuys: table.rebuys,
      rebuyAmount: table.rebuy_amount,
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
