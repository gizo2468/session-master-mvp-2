
import { PokerSession, TableData, HandData } from '@/types/poker';

export const convertDatabaseSessionToPokerSession = (
  sessionData: any,
  tables: any[] = [],
  hands: any[] = []
): PokerSession => {
  console.log('🔄 FIXED: Converting database session with UTC consistency:', sessionData.id);
  
  // CRITICAL FIX: Ensure proper UTC handling for start_time
  let startTime: Date;
  let startTimeUTC: number | undefined;
  
  if (sessionData.start_time_utc) {
    // Use the raw UTC timestamp for accuracy
    startTimeUTC = sessionData.start_time_utc;
    startTime = new Date(startTimeUTC);
    console.log('🕐 FIXED: Using start_time_utc for accurate timing:', { 
      start_time_utc: startTimeUTC, 
      converted_date: startTime.toISOString() 
    });
  } else {
    // Fallback to start_time but ensure it's treated as UTC
    startTime = new Date(sessionData.start_time);
    startTimeUTC = startTime.getTime();
    console.log('🕐 FIXED: Fallback to start_time with UTC conversion:', {
      original: sessionData.start_time,
      converted: startTime.toISOString(),
      utc_timestamp: startTimeUTC
    });
  }

  // CRITICAL FIX: Ensure proper UTC handling for end_time (now timestamptz)
  let endTime: Date | undefined;
  if (sessionData.end_time) {
    // With the schema fix, end_time is now timestamptz - treat it as timezone-aware
    endTime = new Date(sessionData.end_time);
    console.log('🕐 FIXED: Converting end_time as timezone-aware timestamp:', {
      original: sessionData.end_time,
      converted: endTime.toISOString(),
      utc_timestamp: endTime.getTime()
    });
  }

  // CRITICAL FIX: Convert hands with proper data reconstruction
  const convertedHands: HandData[] = hands.map(hand => {
    console.log('🔧 FIXED: Converting hand data with all fields:', {
      handId: hand.id,
      cards: hand.hole_cards,
      action: hand.preflop_action,
      position: hand.position,
      result: hand.showdown_result
    });

    return {
      id: hand.id,
      sessionId: hand.session_id,
      tableId: hand.table_id,
      handNumber: hand.hand_number,
      position: hand.position,
      // CRITICAL FIX: Properly reconstruct cards data
      cards: hand.hole_cards || '',
      action: hand.preflop_action || '',
      holeCards: hand.hole_cards ? hand.hole_cards.split(',').filter(card => card.trim()) : [],
      preflopAction: hand.preflop_action,
      flopCards: hand.flop_cards ? hand.flop_cards.split(',').filter(card => card.trim()) : [],
      flopAction: hand.flop_action,
      turnCard: hand.turn_card,
      turnAction: hand.turn_action,
      riverCard: hand.river_card,
      riverAction: hand.river_action,
      showdownResult: hand.showdown_result,
      // CRITICAL FIX: Ensure result fields are properly mapped
      result: hand.showdown_result,
      resultAmount: parseFloat(hand.amount_won || '0'),
      potSize: parseFloat(hand.pot_size || '0'),
      amountInvested: parseFloat(hand.amount_invested || '0'),
      amountWon: parseFloat(hand.amount_won || '0'),
      notes: hand.hand_notes,
      image: hand.hand_image,
      handImage: hand.hand_image,
      currencyType: hand.currency_type || 'currency',
      createdAt: new Date(hand.created_at)
    };
  });

  // Convert tables with consistent UTC handling and proper hand assignment
  const convertedTables: TableData[] = tables.map(table => {
    console.log('🔄 FIXED: Converting table with UTC consistency:', table.id);
    
    let tableStartTime: Date;
    let tableStartTimeUTC: number | undefined;
    
    if (table.start_time_utc) {
      tableStartTimeUTC = table.start_time_utc;
      tableStartTime = new Date(tableStartTimeUTC);
    } else {
      tableStartTime = new Date(table.start_time);
      tableStartTimeUTC = tableStartTime.getTime();
    }

    let tableEndTime: Date | undefined;
    let tableEndTimeUTC: number | undefined;
    if (table.end_time) {
      // With schema fix, table end_time is now timestamptz - treat as timezone-aware
      tableEndTime = new Date(table.end_time);
      tableEndTimeUTC = table.end_time_utc || tableEndTime.getTime();
      console.log('🕐 FIXED: Table end_time now timezone-aware:', {
        tableId: table.id,
        original: table.end_time,
        converted: tableEndTime.toISOString()
      });
    }

    // CRITICAL FIX: Assign hands to tables properly
    const tableHands = convertedHands.filter(hand => hand.tableId === table.id);
    console.log('🔧 FIXED: Assigning hands to table:', {
      tableId: table.id,
      tableName: table.table_name,
      handsCount: tableHands.length
    });

    return {
      id: table.id,
      name: table.table_name || 'Table',
      format: table.table_type || 'Cash',
      gameType: table.game_format || 'NLH',
      location: sessionData.location || 'Unknown',
      buyIn: parseFloat(table.buy_in || '0'),
      initialBuyIn: parseFloat(table.buy_in || '0'),
      smallBlind: table.stakes ? parseFloat(table.stakes.split('/')[0]) : undefined,
      bigBlind: table.stakes ? parseFloat(table.stakes.split('/')[1]) : undefined,
      startingBB: table.starting_stack,
      currentStack: table.current_stack,
      startTime: tableStartTime,
      startTimeUTC: tableStartTimeUTC,
      endTime: tableEndTime,
      endTimeUTC: tableEndTimeUTC,
      isActive: table.is_active || false,
      cashOut: table.cashout ? parseFloat(table.cashout) : undefined,
      rebuys: table.rebuys || 0,
      rebuyAmount: parseFloat(table.rebuy_amount || '0'),
      bountyAmount: parseFloat(table.bounty_amount || '0'),
      finalPosition: table.final_position,
      notes: table.table_notes,
      // CRITICAL FIX: Ensure hands are properly assigned to tables
      hands: tableHands
    };
  });

  const session: PokerSession = {
    id: sessionData.id,
    gameType: sessionData.game_type || 'NLH',
    format: sessionData.format || 'Cash',
    location: sessionData.location || 'Unknown',
    physicalLocation: sessionData.physical_location,
    tableName: sessionData.table_name,
    buyIn: parseFloat(sessionData.buy_in || '0'),
    initialBuyIn: parseFloat(sessionData.initial_buy_in || sessionData.buy_in || '0'),
    smallBlind: sessionData.small_blind ? parseFloat(sessionData.small_blind) : undefined,
    bigBlind: sessionData.big_blind ? parseFloat(sessionData.big_blind) : undefined,
    isOnline: sessionData.is_online || false,
    startingBB: sessionData.starting_bb,
    tournamentTypes: sessionData.tournament_types,
    isMultiDay: sessionData.is_multi_day || false,
    startTime,
    startTimeUTC,
    endTime,
    isActive: sessionData.is_active || false,
    cashOut: sessionData.cash_out ? parseFloat(sessionData.cash_out) : undefined,
    notes: sessionData.notes,
    currentStatus: sessionData.current_status || 'running',
    sessionDuration: sessionData.session_duration || 0,
    rebuys: sessionData.rebuys || 0,
    rebuyAmount: parseFloat(sessionData.rebuy_amount || '0'),
    roi: parseFloat(sessionData.roi || '0'),
    itmRatioNumerator: sessionData.itm_ratio_numerator || 0,
    itmRatioDenominator: sessionData.itm_ratio_denominator || 0,
    tablesPlayed: sessionData.tables_played || 0,
    tables: convertedTables,
    // CRITICAL FIX: Include session-level hands that don't belong to specific tables
    hands: convertedHands.filter(hand => !hand.tableId)
  };

  console.log('✅ FIXED: Session conversion complete with proper hand assignment:', {
    sessionId: session.id,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString(),
    isActive: session.isActive,
    tablesCount: convertedTables.length,
    totalHandsCount: convertedHands.length,
    sessionLevelHands: session.hands?.length || 0,
    tableHandsBreakdown: convertedTables.map(t => ({ tableId: t.id, handsCount: t.hands?.length || 0 }))
  });

  return session;
};
