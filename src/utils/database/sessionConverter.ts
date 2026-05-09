
import { PokerSession, TableData, HandData } from '@/types/poker';

export const convertDatabaseSessionToPokerSession = (
  sessionData: any,
  tables: any[] = [],
  hands: any[] = []
): PokerSession => {
  console.log('🔄 CONVERTER: Converting database session with validation:', sessionData.id);
  
  // Validate required session data
  if (!sessionData || !sessionData.id) {
    throw new Error('Session data is missing or invalid');
  }
  
  if (!sessionData.start_time && !sessionData.start_time_utc) {
    throw new Error('Session start time is missing');
  }
  
  if (!sessionData.game_type || !sessionData.format) {
    throw new Error('Session game type or format is missing');
  }

  // Ensure proper UTC handling for start_time
  let startTime: Date;
  let startTimeUTC: number | undefined;
  
  try {
    if (sessionData.start_time_utc) {
      // Use the raw UTC timestamp for accuracy
      startTimeUTC = sessionData.start_time_utc;
      startTime = new Date(startTimeUTC);
      console.log('🕐 CONVERTER: Using start_time_utc for timing:', { 
        start_time_utc: startTimeUTC, 
        converted_date: startTime.toISOString() 
      });
    } else {
      // Fallback to start_time but ensure it's treated as UTC
      startTime = new Date(sessionData.start_time);
      startTimeUTC = startTime.getTime();
      console.log('🕐 CONVERTER: Fallback to start_time with UTC conversion:', {
        original: sessionData.start_time,
        converted: startTime.toISOString(),
        utc_timestamp: startTimeUTC
      });
    }

    // Validate converted time
    if (isNaN(startTime.getTime())) {
      throw new Error('Invalid start time data');
    }
  } catch (timeError) {
    console.error('❌ Error converting start time:', timeError);
    throw new Error('Failed to convert session start time');
  }

  // Ensure proper UTC handling for end_time
  let endTime: Date | undefined;
  if (sessionData.end_time) {
    try {
      endTime = new Date(sessionData.end_time);
      if (isNaN(endTime.getTime())) {
        console.warn('⚠️ Invalid end time, setting to undefined');
        endTime = undefined;
      }
    } catch (endTimeError) {
      console.warn('⚠️ Error converting end time:', endTimeError);
      endTime = undefined;
    }
  }

  // CRITICAL FIX: Convert hands with proper ID consistency and validation
  const convertedHands: HandData[] = [];
  
  try {
    hands.forEach((hand, index) => {
      try {
        if (!hand || !hand.id || !hand.session_id) {
          console.warn(`⚠️ Skipping invalid hand at index ${index}:`, hand);
          return;
        }

        // Parse JSONB fields safely
        const parseJsonField = (field: any) => {
          if (!field) return undefined;
          if (typeof field === 'string') {
            try { return JSON.parse(field); } catch { return undefined; }
          }
          return field;
        };

        const convertedHand: HandData = {
          id: hand.id, // Use Supabase ID as local ID
          supabaseId: hand.id, // CRITICAL: Store Supabase ID for future updates
          sessionId: hand.session_id,
          tableId: hand.table_id,
          handNumber: hand.hand_number,
          position: hand.position,
          cards: hand.hole_cards || '',
          action: hand.preflop_action || '',
          holeCards: hand.hole_cards ? hand.hole_cards.split(',').filter((card: string) => card.trim()) : [],
          preflopAction: hand.preflop_action,
          flopCards: hand.flop_cards ? hand.flop_cards.split(',').filter((card: string) => card.trim()) : [],
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
          image: hand.hand_image || undefined, // May be undefined if not fetched (lazy loading)
          currencyType: hand.currency_type || 'currency',
          // New fields for complete hand data persistence
          opponentProfileId: hand.opponent_profile_id || undefined,
          opponentProfileIds: parseJsonField(hand.opponent_profile_ids) || 
            (hand.opponent_profile_id ? [hand.opponent_profile_id] : []),
          smallBlind: hand.small_blind ? parseFloat(hand.small_blind) : undefined,
          bigBlind: hand.big_blind ? parseFloat(hand.big_blind) : undefined,
          heroStackBB: hand.hero_stack_bb ? parseFloat(hand.hero_stack_bb) : undefined,
          gameType: hand.game_type || 'NLH',
          villains: parseJsonField(hand.villains),
          preflopActions: parseJsonField(hand.preflop_actions),
          flopActions: parseJsonField(hand.flop_actions),
          turnActions: parseJsonField(hand.turn_actions),
          riverActions: parseJsonField(hand.river_actions),
          resultValue: hand.result_value != null ? parseFloat(hand.result_value) : undefined,
          resultUnit: hand.result_unit || 'BB',
          // Derive resultAmount from all possible sources so HandsList can always display it
          resultAmount: hand.result_value != null 
            ? parseFloat(hand.result_value) 
            : (parseFloat(hand.amount_won || '0') !== 0 ? parseFloat(hand.amount_won || '0') : undefined),
          createdAt: new Date(hand.created_at)
        };
        
        convertedHands.push(convertedHand);
      } catch (handError) {
        console.error(`❌ Error converting hand at index ${index}:`, handError);
        // Continue with other hands
      }
    });
  } catch (handsError) {
    console.error('❌ Error processing hands array:', handsError);
    // Continue with empty hands array
  }

  console.log('🔄 CONVERTER: Hand conversion summary:', {
    totalHands: convertedHands.length,
    handsWithTableId: convertedHands.filter(h => h.tableId).length,
    handsWithConsistentIds: convertedHands.filter(h => h.id === h.supabaseId).length
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

  // Convert tables with proper hand assignment and validation
  const convertedTables: TableData[] = [];
  
  try {
    tables.forEach((table, index) => {
      try {
        if (!table || !table.id) {
          console.warn(`⚠️ Skipping invalid table at index ${index}:`, table);
          return;
        }

        console.log('🔄 CONVERTER: Converting table with hand assignment:', table.id);
        
        let tableStartTime: Date;
        let tableStartTimeUTC: number | undefined;
        
        try {
          if (table.start_time_utc) {
            tableStartTimeUTC = table.start_time_utc;
            tableStartTime = new Date(tableStartTimeUTC);
          } else {
            tableStartTime = new Date(table.start_time || sessionData.start_time);
            tableStartTimeUTC = tableStartTime.getTime();
          }

          if (isNaN(tableStartTime.getTime())) {
            throw new Error('Invalid table start time');
          }
        } catch (tableTimeError) {
          console.warn(`⚠️ Error converting table ${table.id} start time, using session start time:`, tableTimeError);
          tableStartTime = startTime;
          tableStartTimeUTC = startTimeUTC;
        }

        let tableEndTime: Date | undefined;
        let tableEndTimeUTC: number | undefined;
        if (table.end_time) {
          try {
            tableEndTime = new Date(table.end_time);
            tableEndTimeUTC = table.end_time_utc || tableEndTime.getTime();
            if (isNaN(tableEndTime.getTime())) {
              tableEndTime = undefined;
              tableEndTimeUTC = undefined;
            }
          } catch (tableEndTimeError) {
            console.warn(`⚠️ Error converting table ${table.id} end time:`, tableEndTimeError);
            tableEndTime = undefined;
            tableEndTimeUTC = undefined;
          }
        }

        // Assign hands to this specific table with consistent IDs
        const tableHands = handsByTableId.get(table.id) || [];
        console.log('🔄 CONVERTER: Assigning hands to table:', {
          tableId: table.id,
          tableName: table.table_name,
          handsCount: tableHands.length
        });

        const convertedTable: TableData = {
          id: table.id,
          name: table.table_name || 'Table',
          format: table.table_type || 'Cash',
          gameType: table.game_format || 'NLH',
          location: table.table_name || 'Table',
          buyIn: parseFloat(table.buy_in || '0'),
          initialBuyIn: parseFloat(table.buy_in || '0'),
          currency: table.currency || sessionData.currency || 'USD', // Load currency from table or session
          smallBlind: table.stakes ? parseFloat(table.stakes.split('/')[0]) : undefined,
          bigBlind: table.stakes ? parseFloat(table.stakes.split('/')[1]) : undefined,
          startingBB: table.starting_stack,
          currentStack: table.current_stack,
          startTime: tableStartTime,
          startTimeUTC: tableStartTimeUTC,
          endTime: tableEndTime,
          endTimeUTC: tableEndTimeUTC,
          isActive: table.is_active || false,
          cashOut: table.cashout != null ? parseFloat(table.cashout) : undefined,
          rebuys: table.rebuys || 0,
          rebuyAmount: parseFloat(table.rebuy_amount || '0'),
          bountyAmount: parseFloat(table.bounty_amount || '0'),
          finalPosition: table.final_position,
          notes: table.table_notes,
          tournamentTypes: table.tournament_type ? [table.tournament_type] : undefined, // Load tournament type from database
          isMultiDay: table.is_multi_day || false,
          lateRegistration: table.late_registration || false,
          hands: tableHands // Properly assign hands with consistent IDs
        };

        convertedTables.push(convertedTable);
      } catch (tableError) {
        console.error(`❌ Error converting table at index ${index}:`, tableError);
        // Continue with other tables
      }
    });
  } catch (tablesError) {
    console.error('❌ Error processing tables array:', tablesError);
    // Continue with empty tables array
  }

  // Build the final session object with validation
  try {
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
      festivalName: sessionData.festival_name || undefined,
      currency: sessionData.currency || 'USD',
      startTime,
      startTimeUTC,
      endTime,
      isActive: sessionData.is_active || false,
      cashOut: sessionData.cash_out != null ? parseFloat(sessionData.cash_out) : undefined,
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

    console.log('✅ CONVERTER: Session conversion complete with validation:', {
      sessionId: session.id,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString(),
      isActive: session.isActive,
      tablesCount: convertedTables.length,
      totalTableHands: convertedTables.reduce((sum, table) => sum + (table.hands?.length || 0), 0),
      sessionLevelHands: sessionLevelHands.length
    });

    return session;
  } catch (sessionBuildError) {
    console.error('❌ Error building final session object:', sessionBuildError);
    throw new Error('Failed to construct session object from database data');
  }
};
