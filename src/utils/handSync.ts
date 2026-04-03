
import { supabase } from '@/integrations/supabase/client';
import { HandData } from '@/types/poker';

export const findSupabaseSessionId = async (localSessionId: string, userId: string, sessionStartTime: Date): Promise<string | null> => {
  try {
    // Try to find existing session by start time and user ID
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('start_time', sessionStartTime.toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error finding Supabase session:', error);
      return null;
    }

    return sessions?.id || null;
  } catch (error) {
    console.error('Error in findSupabaseSessionId:', error);
    return null;
  }
};

export const syncHandToSupabase = async (hand: HandData, supabaseSessionId: string): Promise<string | null> => {
  try {
    console.log('🔄 SYNC: Creating hand in Supabase:', {
      handLocalId: hand.id,
      tableId: hand.tableId,
      sessionId: supabaseSessionId,
      holeCards: hand.holeCards,
      position: hand.position
    });

    // Ensure consistent data serialization
    const holeCardsString = hand.holeCards && hand.holeCards.length > 0 
      ? hand.holeCards.join(',')
      : (hand.cards || '');

    const flopCardsString = hand.flopCards && hand.flopCards.length > 0
      ? hand.flopCards.join(',')
      : null;

    // Use the hand's local ID as the Supabase ID for consistency
    const { data, error } = await supabase
      .from('session_hands_new')
      .insert({
        id: hand.id, // Use local ID as Supabase ID for consistency
        session_id: supabaseSessionId,
        user_id: undefined, // Will use DEFAULT auth.uid()
        table_id: hand.tableId || null,
        hand_number: hand.handNumber || null,
        hole_cards: holeCardsString || null,
        position: hand.position || null,
        preflop_action: hand.preflopAction || hand.action || null,
        flop_cards: flopCardsString,
        flop_action: hand.flopAction || null,
        turn_card: hand.turnCard || null,
        turn_action: hand.turnAction || null,
        river_card: hand.riverCard || null,
        river_action: hand.riverAction || null,
        showdown_result: hand.showdownResult || (typeof hand.result === 'string' ? hand.result : null),
        pot_size: hand.potSize || 0,
        amount_won: hand.amountWon || (hand.resultValue ?? hand.resultAmount ?? 0),
        amount_invested: hand.amountInvested || 0,
        hand_notes: hand.notes || null,
        hand_image: hand.handImage || hand.image || null,
        currency_type: hand.currencyType || 'currency',
        opponent_profile_id: hand.opponentProfileIds && hand.opponentProfileIds.length > 0 
          ? hand.opponentProfileIds[0] 
          : null,
        opponent_profile_ids: hand.opponentProfileIds || [],
        // New fields for complete hand data persistence
        villains: hand.villains ? JSON.stringify(hand.villains) : null,
        small_blind: hand.smallBlind || null,
        big_blind: hand.bigBlind || null,
        hero_stack_bb: hand.heroStackBB || null,
        game_type: hand.gameType || 'NLH',
        preflop_actions: hand.preflopActions ? JSON.stringify(hand.preflopActions) : null,
        flop_actions: hand.flopActions ? JSON.stringify(hand.flopActions) : null,
        turn_actions: hand.turnActions ? JSON.stringify(hand.turnActions) : null,
        river_actions: hand.riverActions ? JSON.stringify(hand.riverActions) : null,
        result_value: hand.resultValue ?? null,
        result_unit: hand.resultUnit || 'BB',
        created_at: hand.createdAt.toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ SYNC ERROR: Failed to create hand in Supabase:', error);
      return null;
    }

    console.log('✅ SYNC SUCCESS: Hand created in Supabase:', {
      handLocalId: hand.id,
      supabaseId: data?.id,
      tableId: hand.tableId
    });

    return data?.id || null;
  } catch (error) {
    console.error('❌ SYNC ERROR: Exception in syncHandToSupabase:', error);
    return null;
  }
};

export const syncHandUpdateToSupabase = async (hand: HandData, supabaseSessionId: string, supabaseHandId?: string): Promise<boolean> => {
  try {
    console.log('🔄 UPDATE: Starting hand update in Supabase:', {
      handLocalId: hand.id,
      supabaseHandId: hand.supabaseId || supabaseHandId,
      tableId: hand.tableId,
      sessionId: supabaseSessionId,
      position: hand.position,
      holeCards: hand.holeCards,
      action: hand.preflopAction || hand.action
    });

    // CRITICAL: Use the correct Supabase ID for targeting the record
    const targetHandId = hand.supabaseId || hand.id;
    
    // Pre-update validation: Check if hand exists in database
    const { data: existingHand, error: findError } = await supabase
      .from('session_hands_new')
      .select('id, session_id, hole_cards, position, preflop_action')
      .eq('id', targetHandId)
      .eq('session_id', supabaseSessionId)
      .maybeSingle();
    
    if (findError) {
      console.error('❌ UPDATE ERROR: Failed to find hand for update:', findError);
      return false;
    }
    
    if (!existingHand) {
      console.error('❌ UPDATE ERROR: Hand not found in database:', {
        targetHandId,
        supabaseSessionId
      });
      return false;
    }
    
    console.log('🔍 UPDATE: Found existing hand:', existingHand);

    // Prepare update data with consistent serialization
    const holeCardsString = hand.holeCards && hand.holeCards.length > 0 
      ? hand.holeCards.join(',')
      : (hand.cards || '');

    const flopCardsString = hand.flopCards && hand.flopCards.length > 0
      ? hand.flopCards.join(',')
      : null;

    const updateData = {
      table_id: hand.tableId || null,
      hand_number: hand.handNumber || null,
      hole_cards: holeCardsString || null,
      position: hand.position || null,
      preflop_action: hand.preflopAction || hand.action || null,
      flop_cards: flopCardsString,
      flop_action: hand.flopAction || null,
      turn_card: hand.turnCard || null,
      turn_action: hand.turnAction || null,
      river_card: hand.riverCard || null,
      river_action: hand.riverAction || null,
      showdown_result: hand.showdownResult || (typeof hand.result === 'string' ? hand.result : null),
      pot_size: hand.potSize || 0,
      amount_won: hand.amountWon || (hand.resultValue ?? hand.resultAmount ?? 0),
      amount_invested: hand.amountInvested || 0,
      hand_notes: hand.notes || null,
      hand_image: hand.handImage || hand.image || null,
      currency_type: hand.currencyType || 'currency',
      opponent_profile_id: hand.opponentProfileIds && hand.opponentProfileIds.length > 0 
        ? hand.opponentProfileIds[0] 
        : null,
      opponent_profile_ids: hand.opponentProfileIds || [],
      // New fields for complete hand data persistence
      villains: hand.villains ? JSON.stringify(hand.villains) : null,
      small_blind: hand.smallBlind || null,
      big_blind: hand.bigBlind || null,
      hero_stack_bb: hand.heroStackBB || null,
      game_type: hand.gameType || 'NLH',
      preflop_actions: hand.preflopActions ? JSON.stringify(hand.preflopActions) : null,
      flop_actions: hand.flopActions ? JSON.stringify(hand.flopActions) : null,
      turn_actions: hand.turnActions ? JSON.stringify(hand.turnActions) : null,
      river_actions: hand.riverActions ? JSON.stringify(hand.riverActions) : null,
      result_value: hand.resultValue ?? null,
      result_unit: hand.resultUnit || 'BB',
      updated_at: new Date().toISOString()
    };

    console.log('🔄 UPDATE: Applying changes:', updateData);

    const { data, error } = await supabase
      .from('session_hands_new')
      .update(updateData)
      .eq('id', targetHandId)
      .eq('session_id', supabaseSessionId)
      .select('id, hole_cards, position, preflop_action');

    if (error) {
      console.error('❌ UPDATE ERROR: Failed to update hand:', error);
      return false;
    }

    // Verify update was successful
    if (!data || data.length === 0) {
      console.error('❌ UPDATE ERROR: No rows affected - update failed');
      return false;
    }

    console.log('✅ UPDATE SUCCESS: Hand updated in Supabase:', {
      targetHandId,
      updatedData: data[0],
      affectedRows: data.length
    });

    // Post-update confirmation: Verify changes persisted
    const { data: confirmedHand, error: confirmError } = await supabase
      .from('session_hands_new')
      .select('id, hole_cards, position, preflop_action')
      .eq('id', targetHandId)
      .single();

    if (confirmError) {
      console.warn('⚠️ UPDATE WARNING: Could not confirm persistence:', confirmError);
      return true; // Update succeeded, but confirmation failed
    }

    console.log('✅ UPDATE CONFIRMED: Changes persisted in database:', confirmedHand);
    
    return true;
  } catch (error) {
    console.error('❌ UPDATE ERROR: Exception in syncHandUpdateToSupabase:', error);
    return false;
  }
};

export const syncHandDeleteToSupabase = async (hand: HandData, supabaseSessionId: string, supabaseHandId?: string): Promise<boolean> => {
  try {
    console.log('🔄 DELETE: Removing hand from Supabase:', {
      handLocalId: hand.id,
      supabaseHandId: hand.supabaseId || supabaseHandId,
      tableId: hand.tableId
    });

    // Use the correct Supabase ID
    const targetHandId = hand.supabaseId || hand.id;

    const { error } = await supabase
      .from('session_hands_new')
      .delete()
      .eq('id', targetHandId)
      .eq('session_id', supabaseSessionId);

    if (error) {
      console.error('❌ DELETE ERROR: Failed to delete hand from Supabase:', error);
      return false;
    }

    console.log('✅ DELETE SUCCESS: Hand removed from Supabase:', targetHandId);
    return true;
  } catch (error) {
    console.error('❌ DELETE ERROR: Exception in syncHandDeleteToSupabase:', error);
    return false;
  }
};
