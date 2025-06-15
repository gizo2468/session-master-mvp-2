
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

export const syncHandToSupabase = async (hand: HandData, supabaseSessionId: string): Promise<boolean> => {
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

    const { error } = await supabase
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
      });

    if (error) {
      console.error('❌ FIXED: Error syncing hand to Supabase:', error);
      return false;
    }

    console.log('✅ FIXED: Hand synced successfully to Supabase:', {
      handId: hand.id,
      tableId: hand.tableId,
      holeCards: holeCardsString
    });

    return true;
  } catch (error) {
    console.error('❌ FIXED: Error in syncHandToSupabase:', error);
    return false;
  }
};

export const syncHandUpdateToSupabase = async (hand: HandData, supabaseSessionId: string): Promise<boolean> => {
  try {
    console.log('🔄 FIXED: Updating hand in Supabase with data consistency:', {
      handId: hand.id,
      tableId: hand.tableId
    });

    // Find the hand in Supabase by matching hand details
    const { data: existingHands, error: findError } = await supabase
      .from('session_hands_new')
      .select('id')
      .eq('session_id', supabaseSessionId)
      .eq('hand_number', hand.handNumber || null)
      .eq('created_at', hand.createdAt.toISOString())
      .maybeSingle();

    if (findError) {
      console.error('❌ FIXED: Error finding hand for update:', findError);
      return false;
    }

    if (!existingHands) {
      // Hand doesn't exist in Supabase, create it
      console.log('🔄 FIXED: Hand not found in Supabase, creating new one');
      return await syncHandToSupabase(hand, supabaseSessionId);
    }

    // CRITICAL FIX: Ensure consistent data serialization for updates
    const holeCardsString = hand.holeCards && hand.holeCards.length > 0 
      ? hand.holeCards.join(',')
      : (hand.cards || '');

    const flopCardsString = hand.flopCards && hand.flopCards.length > 0
      ? hand.flopCards.join(',')
      : null;

    const { error } = await supabase
      .from('session_hands_new')
      .update({
        table_id: hand.tableId || null, // CRITICAL: Ensure table_id is preserved
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
      .eq('id', existingHands.id);

    if (error) {
      console.error('❌ FIXED: Error updating hand in Supabase:', error);
      return false;
    }

    console.log('✅ FIXED: Hand updated successfully in Supabase');
    return true;
  } catch (error) {
    console.error('❌ FIXED: Error in syncHandUpdateToSupabase:', error);
    return false;
  }
};

export const syncHandDeleteToSupabase = async (hand: HandData, supabaseSessionId: string): Promise<boolean> => {
  try {
    console.log('🔄 FIXED: Deleting hand from Supabase:', {
      handId: hand.id,
      tableId: hand.tableId
    });

    const { error } = await supabase
      .from('session_hands_new')
      .delete()
      .eq('session_id', supabaseSessionId)
      .eq('hand_number', hand.handNumber || null)
      .eq('created_at', hand.createdAt.toISOString());

    if (error) {
      console.error('❌ FIXED: Error deleting hand from Supabase:', error);
      return false;
    }

    console.log('✅ FIXED: Hand deleted successfully from Supabase');
    return true;
  } catch (error) {
    console.error('❌ FIXED: Error in syncHandDeleteToSupabase:', error);
    return false;
  }
};
