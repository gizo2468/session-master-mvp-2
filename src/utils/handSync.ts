
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
    const { error } = await supabase
      .from('session_hands')
      .insert({
        session_id: supabaseSessionId,
        table_id: hand.tableId || null,
        hand_number: hand.handNumber || null,
        hole_cards: hand.holeCards ? JSON.stringify(hand.holeCards) : (hand.cards ? JSON.stringify([hand.cards]) : null),
        position: hand.position || null,
        preflop_action: hand.preflopAction || hand.action || null,
        flop_cards: hand.flopCards ? JSON.stringify(hand.flopCards) : null,
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
      console.error('Error syncing hand to Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in syncHandToSupabase:', error);
    return false;
  }
};

export const syncHandUpdateToSupabase = async (hand: HandData, supabaseSessionId: string): Promise<boolean> => {
  try {
    // Find the hand in Supabase by matching hand details
    const { data: existingHands, error: findError } = await supabase
      .from('session_hands')
      .select('id')
      .eq('session_id', supabaseSessionId)
      .eq('hand_number', hand.handNumber || null)
      .eq('created_at', hand.createdAt.toISOString())
      .maybeSingle();

    if (findError) {
      console.error('Error finding hand for update:', findError);
      return false;
    }

    if (!existingHands) {
      // Hand doesn't exist in Supabase, create it
      return await syncHandToSupabase(hand, supabaseSessionId);
    }

    const { error } = await supabase
      .from('session_hands')
      .update({
        hole_cards: hand.holeCards ? JSON.stringify(hand.holeCards) : (hand.cards ? JSON.stringify([hand.cards]) : null),
        position: hand.position || null,
        preflop_action: hand.preflopAction || hand.action || null,
        flop_cards: hand.flopCards ? JSON.stringify(hand.flopCards) : null,
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
      console.error('Error updating hand in Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in syncHandUpdateToSupabase:', error);
    return false;
  }
};

export const syncHandDeleteToSupabase = async (hand: HandData, supabaseSessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('session_hands')
      .delete()
      .eq('session_id', supabaseSessionId)
      .eq('hand_number', hand.handNumber || null)
      .eq('created_at', hand.createdAt.toISOString());

    if (error) {
      console.error('Error deleting hand from Supabase:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in syncHandDeleteToSupabase:', error);
    return false;
  }
};
