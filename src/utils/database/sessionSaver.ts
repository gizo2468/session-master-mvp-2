
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
