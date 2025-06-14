
import { supabase } from '@/integrations/supabase/client';
import { PokerSession } from '@/types/poker';

export const saveSessionToDatabase = async (session: PokerSession): Promise<boolean> => {
  try {
    console.log('💾 Saving session to database:', session.id);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No authenticated user found');
      return false;
    }

    // Check if session already exists to determine if this is an insert or update
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id, start_time')
      .eq('id', session.id)
      .single();

    // Prepare session data for database - NEVER include start_time in updates
    const sessionData: any = {
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

    // Only include start_time for new sessions (inserts) - NEVER for updates
    if (!existingSession) {
      sessionData.start_time = session.startTime.toISOString();
      console.log('🆕 New session - including start_time:', sessionData.start_time);
    } else {
      console.log('🔄 Existing session - NEVER updating start_time to preserve integrity');
    }

    // Use insert for new sessions, update for existing ones
    let error;
    if (!existingSession) {
      const { error: insertError } = await supabase
        .from('sessions')
        .insert(sessionData);
      error = insertError;
    } else {
      const { error: updateError } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', session.id);
      error = updateError;
    }

    if (error) {
      console.error('❌ Error saving session:', error);
      return false;
    }

    // Save tables to session_tables
    if (session.tables && session.tables.length > 0) {
      console.log('💾 Saving tables to database:', session.tables.length);
      
      for (const table of session.tables) {
        // Check if table already exists
        const { data: existingTable } = await supabase
          .from('session_tables')
          .select('id, start_time')
          .eq('id', table.id)
          .single();

        const tableData: any = {
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
          end_time: table.endTime?.toISOString(),
          cashout: table.cashOut,
          rebuys: table.rebuys || 0,
          rebuy_amount: table.rebuyAmount || 0,
          bounty_amount: table.bountyAmount || 0,
          final_position: table.finalPosition,
          table_notes: table.notes
        };

        // Only include start_time for new tables - NEVER for updates
        if (!existingTable) {
          tableData.start_time = table.startTime.toISOString();
          console.log('🆕 New table - including start_time:', tableData.start_time);
        } else {
          console.log('🔄 Existing table - NEVER updating start_time to preserve integrity');
        }

        // Use insert for new tables, update for existing ones
        let tableError;
        if (!existingTable) {
          const { error: insertError } = await supabase
            .from('session_tables')
            .insert(tableData);
          tableError = insertError;
        } else {
          const { error: updateError } = await supabase
            .from('session_tables')
            .update(tableData)
            .eq('id', table.id);
          tableError = updateError;
        }

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
