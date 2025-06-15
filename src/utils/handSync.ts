
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
    // CRITICAL FIX: Ensure all hand data is properly saved with user_id for RLS
    const handDataToSave = {
      id: hand.id, // Use the specific hand ID to prevent duplicates
      session_id: supabaseSessionId,
      user_id: undefined, // Will use DEFAULT auth.uid() from schema
      table_id: hand.tableId || null,
      hand_number: hand.handNumber || null,
      position: hand.position || null,
      // CRITICAL: Properly handle hole cards - ensure they're saved correctly
      hole_cards: hand.holeCards ? (Array.isArray(hand.holeCards) ? hand.holeCards.join(',') : hand.holeCards) : (hand.cards || null),
      preflop_action: hand.preflopAction || hand.action || null,
      flop_cards: hand.flopCards ? (Array.isArray(hand.flopCards) ? hand.flopCards.join(',') : hand.flopCards) : null,
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
    };

    console.log('🔧 FIXED: Saving complete hand data to Supabase:', {
      handId: hand.id,
      cards: handDataToSave.hole_cards,
      action: handDataToSave.preflop_action,
      position: handDataToSave.position,
      result: handDataToSave.showdown_result,
      amountWon: handDataToSave.amount_won
    });

    const { error } = await supabase
      .from('session_hands_new')
      .upsert(handDataToSave, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('❌ CRITICAL: Error syncing hand to Supabase:', error);
      return false;
    }

    console.log('✅ FIXED: Hand data successfully saved to Supabase with all fields');
    return true;
  } catch (error) {
    console.error('❌ CRITICAL: Error in syncHandToSupabase:', error);
    return false;
  }
};

export const syncHandUpdateToSupabase = async (hand: HandData, supabaseSessionId: string): Promise<boolean> => {
  try {
    // CRITICAL FIX: Use hand ID for updates to ensure we're updating the right record
    const handDataToUpdate = {
      position: hand.position || null,
      hole_cards: hand.holeCards ? (Array.isArray(hand.holeCards) ? hand.holeCards.join(',') : hand.holeCards) : (hand.cards || null),
      preflop_action: hand.preflopAction || hand.action || null,
      flop_cards: hand.flopCards ? (Array.isArray(hand.flopCards) ? hand.flopCards.join(',') : hand.flopCards) : null,
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
    };

    console.log('🔧 FIXED: Updating hand in Supabase with complete data:', hand.id);

    const { error } = await supabase
      .from('session_hands_new')
      .update(handDataToUpdate)
      .eq('id', hand.id)
      .eq('session_id', supabaseSessionId);

    if (error) {
      console.error('❌ CRITICAL: Error updating hand in Supabase:', error);
      return false;
    }

    console.log('✅ FIXED: Hand successfully updated in Supabase');
    return true;
  } catch (error) {
    console.error('❌ CRITICAL: Error in syncHandUpdateToSupabase:', error);
    return false;
  }
};

export const syncHandDeleteToSupabase = async (hand: HandData, supabaseSessionId: string): Promise<boolean> => {
  try {
    console.log('🗑️ FIXED: Deleting hand from Supabase:', hand.id);

    const { error } = await supabase
      .from('session_hands_new')
      .delete()
      .eq('id', hand.id)
      .eq('session_id', supabaseSessionId);

    if (error) {
      console.error('❌ CRITICAL: Error deleting hand from Supabase:', error);
      return false;
    }

    console.log('✅ FIXED: Hand successfully deleted from Supabase');
    return true;
  } catch (error) {
    console.error('❌ CRITICAL: Error in syncHandDeleteToSupabase:', error);
    return false;
  }
};
