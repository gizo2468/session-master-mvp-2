
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
    console.log('🔄 CRITICAL FIX: Syncing hand to Supabase with enhanced ID tracking:', {
      handLocalId: hand.id,
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

    // CRITICAL FIX: Use the hand's local ID as the Supabase ID for consistency
    const { data, error } = await supabase
      .from('session_hands_new')
      .insert({
        id: hand.id, // CRITICAL FIX: Use local ID as Supabase ID for consistency
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
      console.error('❌ CRITICAL FIX: Error syncing hand to Supabase:', error);
      return null;
    }

    console.log('✅ CRITICAL FIX: Hand synced successfully to Supabase:', {
      handLocalId: hand.id,
      supabaseId: data?.id,
      tableId: hand.tableId,
      holeCards: holeCardsString
    });

    return data?.id || null;
  } catch (error) {
    console.error('❌ CRITICAL FIX: Error in syncHandToSupabase:', error);
    return null;
  }
};

export const syncHandUpdateToSupabase = async (hand: HandData, supabaseSessionId: string, supabaseHandId?: string): Promise<boolean> => {
  try {
    console.log('🔄 CRITICAL FIX: Updating hand in Supabase with enhanced logic:', {
      handLocalId: hand.id,
      supabaseHandId: hand.supabaseId || supabaseHandId,
      tableId: hand.tableId,
      sessionId: supabaseSessionId,
      handData: {
        position: hand.position,
        holeCards: hand.holeCards,
        cards: hand.cards,
        action: hand.preflopAction || hand.action
      }
    });

    // CRITICAL FIX: Use the hand's local ID directly since it should match Supabase ID
    const targetHandId = hand.supabaseId || hand.id;
    
    console.log('🔄 CRITICAL FIX: Using hand ID for update:', targetHandId);

    // CRITICAL FIX: Ensure consistent data serialization for updates
    const holeCardsString = hand.holeCards && hand.holeCards.length > 0 
      ? hand.holeCards.join(',')
      : (hand.cards || '');

    const flopCardsString = hand.flopCards && hand.flopCards.length > 0
      ? hand.flopCards.join(',')
      : null;

    console.log('🔄 CRITICAL FIX: Updating hand with serialized data:', {
      targetHandId,
      holeCards: holeCardsString,
      position: hand.position,
      action: hand.preflopAction || hand.action
    });

    const { data, error } = await supabase
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
      .eq('id', targetHandId)
      .eq('session_id', supabaseSessionId)
      .select('id');

    if (error) {
      console.error('❌ CRITICAL FIX: Error updating hand in Supabase:', error);
      console.error('❌ CRITICAL FIX: Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }

    // CRITICAL FIX: Check if the update actually affected any rows
    if (!data || data.length === 0) {
      console.warn('⚠️ CRITICAL FIX: Update succeeded but no rows were affected - hand may not exist in database');
      console.warn('⚠️ CRITICAL FIX: Attempting to find hand in database for debugging...');
      
      // Try to find the hand to debug
      const { data: existingHand, error: findError } = await supabase
        .from('session_hands_new')
        .select('id, session_id, table_id, hole_cards, position')
        .eq('id', targetHandId)
        .maybeSingle();
      
      if (findError) {
        console.error('❌ CRITICAL FIX: Error searching for hand:', findError);
      } else if (!existingHand) {
        console.error('❌ CRITICAL FIX: Hand not found in database with ID:', targetHandId);
      } else {
        console.log('🔍 CRITICAL FIX: Found existing hand in database:', existingHand);
      }
      
      return false;
    }

    console.log('✅ CRITICAL FIX: Hand updated successfully in Supabase:', {
      targetHandId,
      affectedRows: data.length,
      updatedData: {
        holeCards: holeCardsString,
        position: hand.position,
        action: hand.preflopAction || hand.action
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ CRITICAL FIX: Error in syncHandUpdateToSupabase:', error);
    return false;
  }
};

export const syncHandDeleteToSupabase = async (hand: HandData, supabaseSessionId: string, supabaseHandId?: string): Promise<boolean> => {
  try {
    console.log('🔄 CRITICAL FIX: Deleting hand from Supabase:', {
      handLocalId: hand.id,
      supabaseHandId: hand.supabaseId || supabaseHandId,
      tableId: hand.tableId
    });

    // CRITICAL FIX: Use the hand's ID consistently
    const targetHandId = hand.supabaseId || hand.id;

    const { error } = await supabase
      .from('session_hands_new')
      .delete()
      .eq('id', targetHandId)
      .eq('session_id', supabaseSessionId);

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
