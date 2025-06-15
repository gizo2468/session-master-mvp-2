
import { PokerSession, TableData, HandData } from '@/types/poker';

export const convertDatabaseSessionToPokerSession = (
  sessionData: any,
  tables: any[] = [],
  hands: any[] = []
): PokerSession => {
  console.log('🔄 CRITICAL FIX: Converting database session with enhanced hand ID consistency:', sessionData.id);
  
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

  // CRITICAL FIX: Convert hands with consistent ID mapping
  const convertedHands: HandData[] = hands.map(hand => ({
    id: hand.id, // CRITICAL FIX: Use Supabase ID as local ID for consistency
    supabaseId: hand.id, // CRITICAL FIX: Store the same ID as supabaseId for future updates
    sessionId: hand.session_id,
    tableId: hand.table_id,
    handNumber: hand.hand_number,
    position: hand.position,
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
    potSize: parseFloat(hand.pot_size || '0'),
    amountInvested: parseFloat(hand.amount_invested || '0'),
    amountWon: parseFloat(hand.amount_won || '0'),
    notes: hand.hand_notes,
    image: hand.hand_image,
    currencyType: hand.currency_type || 'currency',
    createdAt: new Date(hand.created_at)
  }));

  console.log('🔄 CRITICAL FIX: Converting hands with consistent ID mapping:', {
    totalHands: convertedHands.length,
    handsWithTableId: convertedHands.filter(h => h.tableId).length,
    handsWithoutTableId: convertedHands.filter(h => !h.tableId).length,
    handsWithSupabaseId: convertedHands.filter(h => h.supabaseId).length,
    sampleHandIds: convertedHands.slice(0, 3).map(h => ({ localId: h.id, supabaseId: h.supabaseId }))
  });

  // Create a mapping of hands by table_id
  const handsByTableId = new Map<string, HandData[]>();
  const sessionLevelHands: HandData[] = [];

  convertedHands.forEach(hand => {
    if (hand.tableId) {
      if (!handsByTableId.has(hand.tableId)) {
        handsByTableId.set(hand.tableId, []);
      }
      handsByTableId.get(hand.tableId)!.push(hand);
    } else {
      // Legacy hands without table_id go to session level
      sessionLevelHands.push(hand);
    }
  });

  // Convert tables with consistent UTC handling and proper hand assignment
  const convertedTables: TableData[] = tables.map(table => {
    console.log('🔄 CRITICAL FIX: Converting table with proper hand assignment:', table.id);
    
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

    // CRITICAL FIX: Assign hands to this specific table with consistent IDs
    const tableHands = handsByTableId.get(table.id) || [];
    console.log('🔄 CRITICAL FIX: Assigning hands to table with consistent IDs:', {
      tableId: table.id,
      tableName: table.table_name,
      handsCount: tableHands.length,
      handsWithSupabaseId: tableHands.filter(h => h.supabaseId).length,
      sampleHandMapping: tableHands.slice(0, 2).map(h => ({ 
        localId: h.id, 
        supabaseId: h.supabaseId,
        consistent: h.id === h.supabaseId 
      }))
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
      hands: tableHands // CRITICAL FIX: Properly assign hands with consistent IDs
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
    hands: sessionLevelHands // Only session-level hands (legacy support)
  };

  console.log('✅ CRITICAL FIX: Session conversion complete with consistent hand ID mapping:', {
    sessionId: session.id,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString(),
    isActive: session.isActive,
    tablesCount: convertedTables.length,
    totalTableHands: convertedTables.reduce((sum, table) => sum + (table.hands?.length || 0), 0),
    sessionLevelHands: sessionLevelHands.length,
    totalHandsWithConsistentIds: convertedTables.reduce((sum, table) => 
      sum + (table.hands?.filter(h => h.id === h.supabaseId).length || 0), 0
    )
  });

  return session;
};
