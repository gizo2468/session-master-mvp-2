
import { supabase } from '@/integrations/supabase/client';
import { SessionData, TableData, HandData } from '@/types/poker';

export const loadSessionData = async (sessionId: string): Promise<SessionData | null> => {
  try {
    console.log('📊 Loading session data for:', sessionId);

    // Load session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('❌ Error loading session:', sessionError);
      return null;
    }

    // Load tables for this session
    const { data: tables, error: tablesError } = await supabase
      .from('session_tables')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');

    if (tablesError) {
      console.error('❌ Error loading tables:', tablesError);
      return null;
    }

    // Load hands for all tables
    const tableIds = tables?.map(t => t.id) || [];
    let allHands: any[] = [];
    
    if (tableIds.length > 0) {
      const { data: hands, error: handsError } = await supabase
        .from('session_hands')
        .select('*')
        .in('table_id', tableIds)
        .order('hand_number');

      if (handsError) {
        console.error('❌ Error loading hands:', handsError);
      } else {
        allHands = hands || [];
      }
    }

    // Transform data to match frontend types
    const transformedTables: TableData[] = (tables || []).map(table => {
      const tableHands = allHands.filter(hand => hand.table_id === table.id);
      
      const transformedHands: HandData[] = tableHands.map(hand => ({
        id: hand.id,
        cards: hand.hole_cards || '',
        position: hand.position || '',
        action: hand.preflop_action || '',
        notes: hand.hand_notes || '',
        result: hand.showdown_result || '',
        resultAmount: hand.amount_won || 0,
        currencyType: hand.currency_type as 'currency' | 'chips' || 'currency',
        createdAt: new Date(hand.created_at),
        tableId: hand.table_id,
        handNumber: hand.hand_number,
        holeCards: hand.hole_cards ? [hand.hole_cards] : undefined,
        preflopAction: hand.preflop_action,
        flopCards: hand.flop_cards ? [hand.flop_cards] : undefined,
        flopAction: hand.flop_action,
        turnCard: hand.turn_card,
        turnAction: hand.turn_action,
        riverCard: hand.river_card,
        riverAction: hand.river_action,
        showdownResult: hand.showdown_result,
        potSize: hand.pot_size,
        amountWon: hand.amount_won,
        amountInvested: hand.amount_invested,
        handImage: hand.hand_image,
      }));

      return {
        id: table.id,
        name: table.table_name || '',
        format: table.game_format as 'Cash' | 'Tournament' || 'Cash',
        gameType: table.table_type as 'NLH' | 'PLO' || 'NLH',
        stakes: table.stakes || '',
        location: 'Online', // Default value
        smallBlind: 0, // Default value
        bigBlind: 0, // Default value
        buyIn: table.buy_in || 0,
        initialBuyIn: table.buy_in || 0, // Use buy_in as initialBuyIn
        startingStack: table.starting_stack || 0,
        currentStack: table.current_stack || 0,
        cashOut: table.cashout || 0,
        startTime: new Date(table.start_time),
        endTime: table.end_time ? new Date(table.end_time) : undefined,
        isActive: table.is_active || false,
        rebuys: table.rebuys || 0,
        rebuyAmount: table.rebuy_amount || 0,
        finalPosition: table.final_position,
        bountyAmount: table.bounty_amount || 0,
        notes: table.table_notes || '',
        hands: transformedHands,
      };
    });

    const sessionData: SessionData = {
      id: session.id,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : undefined,
      gameType: session.game_type as 'NLH' | 'PLO' || 'NLH',
      sessionType: session.format || 'Cash', // Use format field instead of session_type
      notes: session.notes || '',
      tables: transformedTables,
      user_id: session.user_id,
    };

    console.log('✅ Session data loaded successfully:', sessionData);
    return sessionData;

  } catch (error) {
    console.error('❌ Error in loadSessionData:', error);
    return null;
  }
};

export const validateSessionData = (sessionData: SessionData): boolean => {
  if (!sessionData) return false;
  if (!sessionData.id || !sessionData.user_id) return false;
  if (!sessionData.startTime) return false;
  return true;
};
