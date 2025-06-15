
import { PokerSession, HandData, TableData } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { findSupabaseSessionId, syncHandToSupabase, syncHandUpdateToSupabase, syncHandDeleteToSupabase } from '@/utils/handSync';
import { User } from '@/context/AuthContext';

export const createTableHandHandlers = (
  sessions: PokerSession[],
  updateSession: (session: PokerSession) => Promise<void>,
  user: User | null
) => {
  const addTableHand = async (sessionId: string, tableId: string, hand: Omit<HandData, 'id' | 'createdAt' | 'tableId'>) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.tables) return;
    
    const tableIndex = session.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    const table = session.tables[tableIndex];
    const tableFormat = table.format;
    
    // CRITICAL FIX: Ensure all hand data is preserved when creating new hand with proper string conversion
    const newHand: HandData = {
      ...hand,
      id: uuidv4(),
      createdAt: new Date(),
      tableId: tableId,
      sessionId: sessionId,
      // Ensure cards data is properly set as string with safe conversion
      cards: hand.cards || (hand.holeCards ? 
        (Array.isArray(hand.holeCards) ? 
          hand.holeCards.map(card => String(card)).join(',') : 
          String(hand.holeCards)
        ) : ''
      ),
      holeCards: hand.holeCards || (hand.cards ? hand.cards.split(',').filter(c => c.trim()) : []),
      // Ensure action is properly set as string
      action: hand.action || hand.preflopAction || '',
      preflopAction: hand.preflopAction || hand.action || '',
      // Ensure result data is preserved
      result: hand.result || hand.showdownResult,
      showdownResult: hand.showdownResult || hand.result,
      resultAmount: hand.resultAmount || hand.amountWon || 0,
      amountWon: hand.amountWon || hand.resultAmount || 0,
      // Auto-determine currency type based on table format
      currencyType: tableFormat === 'Cash' ? 'currency' : 'chips'
    };
    
    console.log('🔧 FIXED: Creating new table hand with complete data:', {
      handId: newHand.id,
      tableId: tableId,
      cards: newHand.cards,
      action: newHand.action,
      result: newHand.result,
      resultAmount: newHand.resultAmount
    });
    
    const updatedTable = {
      ...table,
      hands: [...(table.hands || []), newHand]
    };
    
    const updatedTables = [...session.tables];
    updatedTables[tableIndex] = updatedTable;
    
    const updatedSession = {
      ...session,
      tables: updatedTables
    };
    
    await updateSession(updatedSession);

    // CRITICAL FIX: Sync to Supabase immediately with complete data
    if (user) {
      try {
        const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
        if (supabaseSessionId) {
          console.log('🔧 FIXED: Syncing complete hand data to Supabase...');
          const synced = await syncHandToSupabase(newHand, supabaseSessionId);
          if (!synced) {
            console.error('❌ CRITICAL: Failed to sync table hand to Supabase, but saved locally');
          } else {
            console.log('✅ FIXED: Hand successfully synced to Supabase with all data');
          }
        } else {
          console.error('❌ CRITICAL: Could not find Supabase session ID for syncing');
        }
      } catch (error) {
        console.error('❌ CRITICAL: Error syncing table hand to Supabase:', error);
      }
    }
  };

  const updateTableHand = async (sessionId: string, tableId: string, hand: HandData) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.tables) return;
    
    const tableIndex = session.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    const table = session.tables[tableIndex];
    if (!table.hands) return;
    
    // CRITICAL FIX: Ensure all hand data is preserved during update with proper string conversion
    const updatedHand = {
      ...hand,
      // Preserve essential data mappings with proper string conversion
      cards: hand.cards || (hand.holeCards ? 
        (Array.isArray(hand.holeCards) ? 
          hand.holeCards.map(card => String(card)).join(',') : 
          String(hand.holeCards)
        ) : ''
      ),
      action: hand.action || hand.preflopAction || '',
      result: hand.result || hand.showdownResult,
      resultAmount: hand.resultAmount || hand.amountWon || 0
    };
    
    console.log('🔧 FIXED: Updating table hand with complete data:', {
      handId: hand.id,
      tableId: tableId,
      cards: updatedHand.cards,
      action: updatedHand.action,
      result: updatedHand.result
    });
    
    const updatedHands = table.hands.map(h => 
      h.id === hand.id ? updatedHand : h
    );
    
    const updatedTable = {
      ...table,
      hands: updatedHands
    };
    
    const updatedTables = [...session.tables];
    updatedTables[tableIndex] = updatedTable;
    
    const updatedSession = {
      ...session,
      tables: updatedTables
    };
    
    await updateSession(updatedSession);

    // Sync update to Supabase if user is logged in
    if (user) {
      try {
        const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
        if (supabaseSessionId) {
          const synced = await syncHandUpdateToSupabase(updatedHand, supabaseSessionId);
          if (!synced) {
            console.error('❌ CRITICAL: Failed to sync table hand update to Supabase, but saved locally');
          } else {
            console.log('✅ FIXED: Hand update successfully synced to Supabase');
          }
        }
      } catch (error) {
        console.error('❌ CRITICAL: Error syncing table hand update to Supabase:', error);
      }
    }
  };

  const deleteTableHand = async (sessionId: string, tableId: string, handId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.tables) return;
    
    const tableIndex = session.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    const table = session.tables[tableIndex];
    if (!table.hands) return;
    
    const handToDelete = table.hands.find(h => h.id === handId);
    const updatedHands = table.hands.filter(hand => hand.id !== handId);
    
    console.log('🗑️ FIXED: Deleting table hand:', {
      handId: handId,
      tableId: tableId,
      handExists: !!handToDelete
    });
    
    const updatedTable = {
      ...table,
      hands: updatedHands
    };
    
    const updatedTables = [...session.tables];
    updatedTables[tableIndex] = updatedTable;
    
    const updatedSession = {
      ...session,
      tables: updatedTables
    };
    
    await updateSession(updatedSession);

    // Sync deletion to Supabase if user is logged in
    if (user && handToDelete) {
      try {
        const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
        if (supabaseSessionId) {
          const synced = await syncHandDeleteToSupabase(handToDelete, supabaseSessionId);
          if (!synced) {
            console.error('❌ CRITICAL: Failed to sync table hand deletion to Supabase, but deleted locally');
          } else {
            console.log('✅ FIXED: Hand deletion successfully synced to Supabase');
          }
        }
      } catch (error) {
        console.error('❌ CRITICAL: Error syncing hand deletion to Supabase:', error);
      }
    }
  };

  return { addTableHand, updateTableHand, deleteTableHand };
};
