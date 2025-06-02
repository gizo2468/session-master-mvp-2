
import { supabase } from '@/integrations/supabase/client';
import { HandData, TableData, PokerSession } from '@/types/poker';
import { validateSessionAccess, syncLocalSessionToSupabase } from './sessionValidation';

export interface SessionDataResult {
  success: boolean;
  sessionData?: any;
  tableData?: TableData[];
  handData?: HandData[];
  errorType?: 'not_found' | 'permission_denied' | 'network_error' | 'data_error';
  errorMessage?: string;
  fallbackToLocal?: boolean;
}

export const loadSessionData = async (
  sessionId: string,
  userId: string,
  mode: 'student' | 'coach' = 'student',
  studentId?: string,
  localSessions?: PokerSession[]
): Promise<SessionDataResult> => {
  try {
    console.log('🔄 Loading session data:', { sessionId, userId, mode, studentId });

    // First validate access
    const validation = await validateSessionAccess(sessionId, userId, mode, studentId);
    
    if (!validation.exists) {
      // Try to find in local storage and sync
      if (localSessions && mode === 'student') {
        const localSession = localSessions.find(s => s.id === sessionId);
        if (localSession && !localSession.isActive) {
          console.log('🔄 Found session in local storage, attempting sync...');
          const synced = await syncLocalSessionToSupabase(localSession, userId);
          if (synced) {
            // Retry validation after sync
            const retryValidation = await validateSessionAccess(sessionId, userId, mode, studentId);
            if (!retryValidation.exists) {
              return {
                success: false,
                errorType: 'not_found',
                errorMessage: 'Session could not be synced to cloud storage.'
              };
            }
          } else {
            return {
              success: false,
              errorType: 'not_found',
              errorMessage: validation.errorMessage || 'Session not found.',
              fallbackToLocal: true
            };
          }
        } else {
          return {
            success: false,
            errorType: validation.errorType || 'not_found',
            errorMessage: validation.errorMessage || 'Session not found.'
          };
        }
      } else {
        return {
          success: false,
          errorType: validation.errorType || 'not_found',
          errorMessage: validation.errorMessage || 'Session not found.'
        };
      }
    }

    if (!validation.hasPermission) {
      return {
        success: false,
        errorType: validation.errorType || 'permission_denied',
        errorMessage: validation.errorMessage || 'Access denied.'
      };
    }

    // Load complete session data from Supabase
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ Error loading session:', sessionError);
      return {
        success: false,
        errorType: 'data_error',
        errorMessage: 'Failed to load session details.'
      };
    }

    // Load table data
    const { data: tableData, error: tableError } = await supabase
      .from('session_tables')
      .select('*')
      .eq('session_id', sessionId)
      .order('start_time', { ascending: true });

    if (tableError) {
      console.error('❌ Error loading table data:', tableError);
    }

    // Load hand data
    const { data: handData, error: handError } = await supabase
      .from('session_hands')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (handError) {
      console.error('❌ Error loading hand data:', handError);
    }

    // Convert hand data to proper format
    const convertedHandData: HandData[] = (handData || []).map(hand => ({
      id: hand.id,
      tableId: hand.table_id || undefined,
      handNumber: hand.hand_number || undefined,
      cards: hand.hole_cards ? JSON.parse(hand.hole_cards)[0] : undefined,
      holeCards: hand.hole_cards ? JSON.parse(hand.hole_cards) : undefined,
      position: hand.position || undefined,
      action: hand.preflop_action || undefined,
      preflopAction: hand.preflop_action || undefined,
      flopCards: hand.flop_cards ? JSON.parse(hand.flop_cards) : undefined,
      flopAction: hand.flop_action || undefined,
      turnCard: hand.turn_card || undefined,
      turnAction: hand.turn_action || undefined,
      riverCard: hand.river_card || undefined,
      riverAction: hand.river_action || undefined,
      result: hand.showdown_result || undefined,
      showdownResult: hand.showdown_result || undefined,
      potSize: hand.pot_size ? Number(hand.pot_size) : undefined,
      amountWon: hand.amount_won ? Number(hand.amount_won) : 0,
      resultAmount: hand.amount_won ? Number(hand.amount_won) : 0,
      amountInvested: hand.amount_invested ? Number(hand.amount_invested) : 0,
      notes: hand.hand_notes || undefined,
      image: hand.hand_image || undefined,
      handImage: hand.hand_image || undefined,
      currencyType: (hand.currency_type as 'currency' | 'chips') || 'currency',
      createdAt: new Date(hand.created_at || Date.now())
    }));

    // Convert table data to proper format
    const convertedTableData: TableData[] = (tableData || []).map(table => ({
      id: table.id,
      name: table.table_name || 'Table',
      format: (table.table_type as 'Cash' | 'Tournament') || 'Cash',
      gameType: table.game_format || 'Texas Hold\'em',
      stakes: table.stakes || '',
      smallBlind: 0, // Will be parsed from stakes if needed
      bigBlind: 0, // Will be parsed from stakes if needed
      buyIn: table.buy_in ? Number(table.buy_in) : 0,
      startingStack: table.starting_stack || undefined,
      currentStack: table.current_stack || undefined,
      rebuys: table.rebuys || 0,
      rebuyAmount: table.rebuy_amount ? Number(table.rebuy_amount) : undefined,
      bountyAmount: table.bounty_amount ? Number(table.bounty_amount) : undefined,
      bountyCount: table.players_eliminated || undefined,
      finalPosition: table.final_position || undefined,
      cashOut: table.cashout ? Number(table.cashout) : 0,
      notes: table.table_notes || undefined,
      startTime: new Date(table.start_time || Date.now()),
      endTime: table.end_time ? new Date(table.end_time) : undefined,
      isActive: table.is_active || false,
      initialBuyIn: table.buy_in ? Number(table.buy_in) : 0,
      hands: convertedHandData.filter(hand => hand.tableId === table.id)
    }));

    console.log('✅ Session data loaded successfully:', {
      sessionData: sessionData.id,
      tableCount: convertedTableData.length,
      handCount: convertedHandData.length
    });

    return {
      success: true,
      sessionData,
      tableData: convertedTableData,
      handData: convertedHandData.filter(hand => !hand.tableId) // Session-level hands
    };

  } catch (error) {
    console.error('❌ Error in loadSessionData:', error);
    return {
      success: false,
      errorType: 'network_error',
      errorMessage: 'Failed to load session data. Please check your connection and try again.'
    };
  }
};
