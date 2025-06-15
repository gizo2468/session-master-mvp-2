
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
    console.log('🔄 FIXED: Syncing hand to Supabase with proper data consistency:', {
      handId: hand.id,
      tableId: hand.tableId,
      sessionId: supabaseSessionId,
      holeCards: hand.holeCards,
      cards: hand.cards
    });

    // CRITICAL FIX: Ensure consistent data serialization
    const holeCardsString = hand.holeCards && hand.holeCards.length > 0 
      ? hand.holeCards.join(',')
      : (hand.cards || '');

    const flopCardsString = hand.flopCards && hand.flopCards.length > 0
      ? hand.flopCards.join(',')
      : null;

    // CRITICAL FIX: Ensure table_id is always set for table hands
    if (!hand.tableId) {
      console.warn('⚠️ FIXED: Hand missing tableId - this may cause persistence issues:', hand.id);
    }

    const { data, error } = await supabase
      .from('session_hands_new')
      .insert({
        session_id: supabaseSessionId,
        user_id: undefined, // Will use DEFAULT auth.uid()
        table_id: hand.tableId || null, // CRITICAL: Ensure table_id is set
        hand_number: hand.handNumber || null,
        hole_cards: holeCardsString || null, // FIXED: Consistent string format
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
        amount_won: hand.amountWon || hand.resultAmount || 0,
        amount_invested: hand.amountInvested || 0,
        hand_notes: hand.notes || null,
        hand_image: hand.handImage || hand.image || null,
        currency_type: hand.currencyType || 'currency',
        created_at: hand.createdAt.toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ FIXED: Error syncing hand to Supabase:', error);
      return null;
    }

    console.log('✅ FIXED: Hand synced successfully to Supabase:', {
      handId: hand.id,
      supabaseId: data?.id,
      tableId: hand.tableId,
      holeCards: holeCardsString
    });

    return data?.id || null;
  } catch (error) {
    console.error('❌ FIXED: Error in syncHandToSupabase:', error);
    return null;
  }
};

export const syncHandUpdateToSupabase = async (hand: HandData, supabaseSessionId: string, supabaseHandId?: string): Promise<boolean> => {
  try {
    console.log('🔄 CRITICAL FIX: Updating hand in Supabase:', {
      handId: hand.id,
      supabaseHandId: hand.supabaseId || supabaseHandId,
      tableId: hand.tableId,
      sessionId: supabaseSessionId
    });

    // CRITICAL FIX: Use the supabase hand ID from the hand object first, then fallback
    let targetHandId = hand.supabaseId || supabaseHandId;
    
    if (!targetHandId) {
      console.log('🔍 CRITICAL FIX: No supabase hand ID available, searching by local hand ID...');
      
      // CRITICAL FIX: Try to find the hand by the local hand ID stored as the id in Supabase
      const { data: existingHands, error: findError } = await supabase
        .from('session_hands_new')
        .select('id')
        .eq('session_id', supabaseSessionId)
        .eq('id', hand.id) // Use local hand ID as it should match Supabase ID
        .maybeSingle();

      if (findError) {
        console.error('❌ CRITICAL FIX: Error finding hand for update:', findError);
        return false;
      }

      if (!existingHands) {
        console.warn('⚠️ CRITICAL FIX: Hand not found in Supabase for update, this should not happen for existing hands');
        return false;
      }

      targetHandId = existingHands.id;
    }

    // CRITICAL FIX: Ensure consistent data serialization for updates
    const holeCardsString = hand.holeCards && hand.holeCards.length > 0 
      ? hand.holeCards.join(',')
      : (hand.cards || '');

    const flopCardsString = hand.flopCards && hand.flopCards.length > 0
      ? hand.flopCards.join(',')
      : null;

    console.log('🔄 CRITICAL FIX: Updating hand with data:', {
      targetHandId,
      holeCards: holeCardsString,
      position: hand.position,
      action: hand.preflopAction || hand.action
    });

    const { error } = await supabase
      .from('session_hands_new')
      .update({
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
        amount_won: hand.amountWon || hand.resultAmount || 0,
        amount_invested: hand.amountInvested || 0,
        hand_notes: hand.notes || null,
        hand_image: hand.handImage || hand.image || null,
        currency_type: hand.currencyType || 'currency',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetHandId);

    if (error) {
      console.error('❌ CRITICAL FIX: Error updating hand in Supabase:', error);
      return false;
    }

    console.log('✅ CRITICAL FIX: Hand updated successfully in Supabase with ID:', targetHandId);
    return true;
  } catch (error) {
    console.error('❌ CRITICAL FIX: Error in syncHandUpdateToSupabase:', error);
    return false;
  }
};

export const syncHandDeleteToSupabase = async (hand: HandData, supabaseSessionId: string, supabaseHandId?: string): Promise<boolean> => {
  try {
    console.log('🔄 CRITICAL FIX: Deleting hand from Supabase:', {
      handId: hand.id,
      supabaseHandId: hand.supabaseId || supabaseHandId,
      tableId: hand.tableId
    });

    // CRITICAL FIX: Use the supabase hand ID from the hand object first, then fallback
    let targetHandId = hand.supabaseId || supabaseHandId;
    
    if (!targetHandId) {
      console.log('🔍 CRITICAL FIX: No supabase hand ID available, using local hand ID...');
      // For deletion, we can try using the local hand ID directly
      targetHandId = hand.id;
    }

    const { error } = await supabase
      .from('session_hands_new')
      .delete()
      .eq('id', targetHandId);

    if (error) {
      console.error('❌ CRITICAL FIX: Error deleting hand from Supabase:', error);
      return false;
    }

    console.log('✅ CRITICAL FIX: Hand deleted successfully from Supabase with ID:', targetHandId);
    return true;
  } catch (error) {
    console.error('❌ CRITICAL FIX: Error in syncHandDeleteToSupabase:', error);
    return false;
  }
};
