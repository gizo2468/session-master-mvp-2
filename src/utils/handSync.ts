
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
    console.log('🔄 CRITICAL FIX: Updating hand in Supabase with direct ID lookup:', {
      handId: hand.id,
      supabaseHandId,
      tableId: hand.tableId
    });

    // CRITICAL FIX: Use the supabase hand ID if available, otherwise try to find it
    let targetHandId = supabaseHandId;
    
    if (!targetHandId) {
      console.log('🔍 CRITICAL FIX: No supabase hand ID provided, searching by session and table...');
      
      // Try to find the hand by matching session_id, table_id, and created_at
      const { data: existingHands, error: findError } = await supabase
        .from('session_hands_new')
        .select('id')
        .eq('session_id', supabaseSessionId)
        .eq('table_id', hand.tableId)
        .eq('created_at', hand.createdAt.toISOString())
        .maybeSingle();

      if (findError) {
        console.error('❌ CRITICAL FIX: Error finding hand for update:', findError);
        return false;
      }

      if (!existingHands) {
        console.warn('⚠️ CRITICAL FIX: Hand not found in Supabase for update, creating new one');
        const newHandId = await syncHandToSupabase(hand, supabaseSessionId);
        return newHandId !== null;
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

    const { error } = await supabase
      .from('session_hands_new')
      .update({
        table_id: hand.tableId || null, // CRITICAL: Ensure table_id is preserved
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
    console.log('🔄 CRITICAL FIX: Deleting hand from Supabase with direct ID lookup:', {
      handId: hand.id,
      supabaseHandId,
      tableId: hand.tableId
    });

    // CRITICAL FIX: Use the supabase hand ID if available, otherwise try to find it
    let targetHandId = supabaseHandId;
    
    if (!targetHandId) {
      console.log('🔍 CRITICAL FIX: No supabase hand ID provided, searching by session and table...');
      
      // Try to find the hand by matching session_id, table_id, and created_at
      const { data: existingHands, error: findError } = await supabase
        .from('session_hands_new')
        .select('id')
        .eq('session_id', supabaseSessionId)
        .eq('table_id', hand.tableId)
        .eq('created_at', hand.createdAt.toISOString())
        .maybeSingle();

      if (findError) {
        console.error('❌ CRITICAL FIX: Error finding hand for deletion:', findError);
        return false;
      }

      if (!existingHands) {
        console.warn('⚠️ CRITICAL FIX: Hand not found in Supabase for deletion');
        return true; // Consider it successful if already doesn't exist
      }

      targetHandId = existingHands.id;
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
