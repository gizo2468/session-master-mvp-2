
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
    
    console.log('🔄 FIXED: Adding hand to table with proper data structure:', {
      sessionId,
      tableId,
      tableFormat,
      handData: {
        cards: hand.cards,
        holeCards: hand.holeCards,
        position: hand.position,
        action: hand.action
      }
    });

    // CRITICAL FIX: Ensure proper data conversion and validation
    const holeCardsArray = hand.holeCards && Array.isArray(hand.holeCards) 
      ? hand.holeCards 
      : (hand.cards ? [String(hand.cards)] : []);

    const newHand: HandData = {
      ...hand,
      id: uuidv4(),
      createdAt: new Date(),
      tableId: tableId, // CRITICAL: Ensure tableId is always set
      holeCards: holeCardsArray,
      cards: hand.cards ? String(hand.cards) : '', // FIXED: Ensure string conversion
      // Auto-determine currency type based on table format
      currencyType: tableFormat === 'Cash' ? 'currency' : 'chips'
    };
    
    console.log('🔄 FIXED: Created new hand with consistent data:', {
      handId: newHand.id,
      tableId: newHand.tableId,
      holeCards: newHand.holeCards,
      cards: newHand.cards
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
    
    console.log('🔄 FIXED: Updating session with new hand count:', {
      tableId,
      previousHandsCount: table.hands?.length || 0,
      newHandsCount: updatedTable.hands.length
    });

    await updateSession(updatedSession);

    // Sync to Supabase if user is logged in
    if (user) {
      try {
        const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
        if (supabaseSessionId) {
          console.log('🔄 FIXED: Syncing hand to Supabase:', {
            handId: newHand.id,
            supabaseSessionId
          });
          const synced = await syncHandToSupabase(newHand, supabaseSessionId);
          if (!synced) {
            console.warn('⚠️ FIXED: Failed to sync table hand to Supabase, but saved locally');
          } else {
            console.log('✅ FIXED: Hand successfully synced to Supabase');
          }
        } else {
          console.warn('⚠️ FIXED: Could not find Supabase session ID for sync');
        }
      } catch (error) {
        console.error('❌ FIXED: Error syncing table hand to Supabase:', error);
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
    
    console.log('🔄 FIXED: Updating hand in table:', {
      sessionId,
      tableId,
      handId: hand.id
    });

    const updatedHands = table.hands.map(h => 
      h.id === hand.id ? hand : h
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
          const synced = await syncHandUpdateToSupabase(hand, supabaseSessionId);
          if (!synced) {
            console.warn('⚠️ FIXED: Failed to sync table hand update to Supabase, but saved locally');
          } else {
            console.log('✅ FIXED: Hand update successfully synced to Supabase');
          }
        }
      } catch (error) {
        console.error('❌ FIXED: Error syncing table hand update to Supabase:', error);
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
    
    console.log('🔄 FIXED: Deleting hand from table:', {
      sessionId,
      tableId,
      handId
    });

    const handToDelete = table.hands.find(h => h.id === handId);
    const updatedHands = table.hands.filter(hand => hand.id !== handId);
    
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
            console.warn('⚠️ FIXED: Failed to sync table hand deletion to Supabase, but deleted locally');
          } else {
            console.log('✅ FIXED: Hand deletion successfully synced to Supabase');
          }
        }
      } catch (error) {
        console.error('❌ FIXED: Error syncing hand deletion to Supabase:', error);
      }
    }
  };

  return { addTableHand, updateTableHand, deleteTableHand };
};
