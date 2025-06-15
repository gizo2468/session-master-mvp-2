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
    
    console.log('🔄 CRITICAL FIX: Adding hand to table with enhanced ID tracking:', {
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

    // CRITICAL FIX: Create hand with proper data structure
    const holeCardsArray = hand.holeCards && Array.isArray(hand.holeCards) 
      ? hand.holeCards 
      : (hand.cards ? [String(hand.cards)] : []);

    const newHand: HandData = {
      ...hand,
      id: uuidv4(),
      createdAt: new Date(),
      tableId: tableId,
      holeCards: holeCardsArray,
      cards: hand.cards ? String(hand.cards) : '',
      currencyType: tableFormat === 'Cash' ? 'currency' : 'chips'
    };
    
    console.log('🔄 CRITICAL FIX: Created new hand with local ID:', {
      handId: newHand.id,
      tableId: newHand.tableId
    });

    // CRITICAL FIX: First update local state
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
    console.log('✅ CRITICAL FIX: Local session state updated with new hand');

    // CRITICAL FIX: Sync to Supabase and update hand with Supabase ID
    if (user) {
      try {
        const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
        if (supabaseSessionId) {
          console.log('🔄 CRITICAL FIX: Syncing hand to Supabase for ID assignment:', {
            handId: newHand.id,
            supabaseSessionId
          });
          
          const supabaseHandId = await syncHandToSupabase(newHand, supabaseSessionId);
          if (supabaseHandId) {
            // CRITICAL FIX: Update the hand with the Supabase ID in local state
            newHand.supabaseId = supabaseHandId;
            
            // Update the hand in the session with the Supabase ID
            const handIndex = updatedTable.hands.findIndex(h => h.id === newHand.id);
            if (handIndex !== -1) {
              updatedTable.hands[handIndex] = { ...newHand };
              
              const finalUpdatedSession = {
                ...updatedSession,
                tables: [...updatedTables]
              };
              
              await updateSession(finalUpdatedSession);
              console.log('✅ CRITICAL FIX: Hand updated with Supabase ID:', {
                localId: newHand.id,
                supabaseId: supabaseHandId
              });
            }
          } else {
            console.warn('⚠️ CRITICAL FIX: Failed to get Supabase ID for hand, but saved locally');
          }
        } else {
          console.warn('⚠️ CRITICAL FIX: Could not find Supabase session ID for sync');
        }
      } catch (error) {
        console.error('❌ CRITICAL FIX: Error syncing table hand to Supabase:', error);
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
    
    console.log('🔄 CRITICAL FIX: Updating hand with enhanced tracking:', {
      sessionId,
      tableId,
      handId: hand.id,
      supabaseId: hand.supabaseId,
      hasUser: !!user,
      handData: {
        position: hand.position,
        holeCards: hand.holeCards,
        action: hand.action || hand.preflopAction,
        cards: hand.cards
      }
    });

    // CRITICAL FIX: Update local state first
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
    console.log('✅ CRITICAL FIX: Local session state updated successfully');

    // CRITICAL FIX: Sync update to Supabase with better error handling
    if (user) {
      try {
        console.log('🔄 CRITICAL FIX: Starting Supabase sync for hand update...');
        const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
        if (supabaseSessionId) {
          console.log('🔄 CRITICAL FIX: Found Supabase session ID, attempting update:', {
            supabaseSessionId,
            handLocalId: hand.id,
            handSupabaseId: hand.supabaseId
          });
          
          const synced = await syncHandUpdateToSupabase(hand, supabaseSessionId, hand.supabaseId);
          if (!synced) {
            console.error('❌ CRITICAL FIX: Supabase update failed - hand changes may not persist across refreshes');
            // Don't throw error here - keep local changes but warn user
          } else {
            console.log('✅ CRITICAL FIX: Hand update successfully synced to Supabase - changes will persist');
          }
        } else {
          console.error('❌ CRITICAL FIX: Could not find Supabase session ID for sync');
        }
      } catch (error) {
        console.error('❌ CRITICAL FIX: Error syncing table hand update to Supabase:', error);
        // Don't fail the entire operation - local changes are preserved
      }
    } else {
      console.warn('⚠️ CRITICAL FIX: No user logged in, skipping Supabase sync');
    }
  };

  const deleteTableHand = async (sessionId: string, tableId: string, handId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.tables) return;
    
    const tableIndex = session.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    const table = session.tables[tableIndex];
    if (!table.hands) return;
    
    console.log('🔄 CRITICAL FIX: Deleting hand from table with Supabase sync:', {
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

    // CRITICAL FIX: Sync deletion to Supabase
    if (user && handToDelete) {
      try {
        const supabaseSessionId = await findSupabaseSessionId(sessionId, user.id, session.startTime);
        if (supabaseSessionId) {
          const synced = await syncHandDeleteToSupabase(handToDelete, supabaseSessionId, handToDelete.supabaseId);
          if (!synced) {
            console.warn('⚠️ CRITICAL FIX: Failed to sync table hand deletion to Supabase, but deleted locally');
          } else {
            console.log('✅ CRITICAL FIX: Hand deletion successfully synced to Supabase');
          }
        }
      } catch (error) {
        console.error('❌ CRITICAL FIX: Error syncing hand deletion to Supabase:', error);
      }
    }
  };

  return { addTableHand, updateTableHand, deleteTableHand };
};
