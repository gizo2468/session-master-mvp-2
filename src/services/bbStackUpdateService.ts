import { supabase } from '@/integrations/supabase/client';

interface BBStackUpdate {
  id?: string;
  user_id: string;
  session_id: string;
  table_id: string;
  level?: number;
  stack?: number;
  bb?: number;
  small_blind?: number;
  big_blind?: number;
  created_at?: string;
}

export class BBStackUpdateService {
  static async saveBBStackUpdate(data: {
    sessionId: string;
    tableId: string;
    level?: number;
    stack?: string;
    bb?: string;
    smallBlind?: number;
    bigBlind?: number;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updateData: {
        user_id: string;
        session_id: string;
        table_id: string;
        level?: number;
        stack?: number;
        bb?: number;
        small_blind?: number;
        big_blind?: number;
      } = {
        user_id: user.id,
        session_id: data.sessionId,
        table_id: data.tableId,
      };

      // Add tournament fields if provided
      if (data.level !== undefined) updateData.level = data.level;
      if (data.stack && data.stack !== '') updateData.stack = parseInt(data.stack);
      if (data.bb && data.bb !== '') updateData.bb = parseInt(data.bb);

      // Add cash game fields if provided
      if (data.smallBlind !== undefined) updateData.small_blind = data.smallBlind;
      if (data.bigBlind !== undefined) updateData.big_blind = data.bigBlind;

      const { error } = await supabase
        .from('table_bb_stack_updates')
        .insert(updateData);

      if (error) {
        console.error('Error saving BB/Stack update:', error);
        throw error;
      }

      console.log('BB/Stack update saved successfully:', updateData);
    } catch (error) {
      console.error('BBStackUpdateService.saveBBStackUpdate error:', error);
      throw error;
    }
  }

  static async getBBStackHistory(tableId: string): Promise<BBStackUpdate[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('table_bb_stack_updates')
        .select('*')
        .eq('table_id', tableId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching BB/Stack history:', error);
        throw error;
      }

      if (!data) return [];

      // For cash games, return all entries (blinds can change multiple times)
      // For tournaments, deduplicate identical entries within the same level
      const processedData: BBStackUpdate[] = [];

      data.forEach(update => {
        // If it's a cash game (has small_blind/big_blind), keep all entries
        if (update.small_blind !== null && update.big_blind !== null) {
          processedData.push(update);
        } 
        // If it's a tournament (has level), check for duplicates
        else if (update.level !== null) {
          // Check if we already have an identical entry for this level
          const existingEntry = processedData.find(existing => 
            existing.level === update.level &&
            existing.bb === update.bb &&
            existing.stack === update.stack
          );
          
          // Only add if no identical entry exists, or if this is more recent
          if (!existingEntry) {
            processedData.push(update);
          } else {
            // If identical entry exists, keep the more recent one
            const updateTime = new Date(update.created_at!).getTime();
            const existingTime = new Date(existingEntry.created_at!).getTime();
            
            if (updateTime > existingTime) {
              // Replace the existing entry with the newer one
              const index = processedData.indexOf(existingEntry);
              processedData[index] = update;
            }
          }
        }
      });

      return processedData;
    } catch (error) {
      console.error('BBStackUpdateService.getBBStackHistory error:', error);
      throw error;
    }
  }

  static async getHighestLevel(tableId: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('table_bb_stack_updates')
        .select('level')
        .eq('table_id', tableId)
        .eq('user_id', user.id)
        .not('level', 'is', null)
        .order('level', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching highest level:', error);
        throw error;
      }

      return data?.[0]?.level || 0;
    } catch (error) {
      console.error('BBStackUpdateService.getHighestLevel error:', error);
      return 0;
    }
  }

  static async getLatestBBStackForSharedSession(sessionId: string): Promise<Map<string, BBStackUpdate>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the latest BB/Stack update for each table in the session
      const { data, error } = await supabase
        .from('table_bb_stack_updates')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching BB/Stack updates for shared session:', error);
        throw error;
      }

      if (!data) return new Map();

      // Group by table_id and keep only the latest update for each table
      const latestUpdates = new Map<string, BBStackUpdate>();
      
      data.forEach(update => {
        if (!latestUpdates.has(update.table_id)) {
          latestUpdates.set(update.table_id, update);
        }
      });

      return latestUpdates;
    } catch (error) {
      console.error('BBStackUpdateService.getLatestBBStackForSharedSession error:', error);
      return new Map();
    }
  }

  static async getHighestLevelsBatch(tableIds: string[]): Promise<Record<string, number>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (tableIds.length === 0) return {};

      const { data, error } = await supabase
        .from('table_bb_stack_updates')
        .select('table_id, level')
        .eq('user_id', user.id)
        .in('table_id', tableIds)
        .not('level', 'is', null)
        .order('table_id', { ascending: true })
        .order('level', { ascending: false });

      if (error) {
        console.error('Error fetching highest levels batch:', error);
        throw error;
      }

      if (!data) return {};

      // Build a map keeping the first (highest) level per table_id
      const levelsMap: Record<string, number> = {};
      data.forEach(row => {
        if (!levelsMap[row.table_id] && row.level !== null) {
          levelsMap[row.table_id] = row.level;
        }
      });

      return levelsMap;
    } catch (error) {
      console.error('BBStackUpdateService.getHighestLevelsBatch error:', error);
      return {};
    }
  }

  static async getBBStackHistoriesBatch(tableIds: string[]): Promise<Record<string, BBStackUpdate[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (tableIds.length === 0) return {};

      const { data, error } = await supabase
        .from('table_bb_stack_updates')
        .select('*')
        .eq('user_id', user.id)
        .in('table_id', tableIds)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching BB/Stack histories batch:', error);
        throw error;
      }

      if (!data) return {};

      // Group by table_id and process each group
      const historiesMap: Record<string, BBStackUpdate[]> = {};
      
      tableIds.forEach(tableId => {
        const tableData = data.filter(row => row.table_id === tableId);
        const processedData: BBStackUpdate[] = [];

        tableData.forEach(update => {
          // If it's a cash game (has small_blind/big_blind), keep all entries
          if (update.small_blind !== null && update.big_blind !== null) {
            processedData.push(update);
          } 
          // If it's a tournament (has level), check for duplicates
          else if (update.level !== null) {
            const existingEntry = processedData.find(existing => 
              existing.level === update.level &&
              existing.bb === update.bb &&
              existing.stack === update.stack
            );
            
            if (!existingEntry) {
              processedData.push(update);
            } else {
              // Keep the more recent one
              const updateTime = new Date(update.created_at!).getTime();
              const existingTime = new Date(existingEntry.created_at!).getTime();
              
              if (updateTime > existingTime) {
                const index = processedData.indexOf(existingEntry);
                processedData[index] = update;
              }
            }
          }
        });

        historiesMap[tableId] = processedData;
      });

      return historiesMap;
    } catch (error) {
      console.error('BBStackUpdateService.getBBStackHistoriesBatch error:', error);
      return {};
    }
  }

  static async saveBBStackUpdatesBulk(updates: Array<{
    sessionId: string;
    tableId: string;
    level?: number;
    stack?: string;
    bb?: string;
    smallBlind?: number;
    bigBlind?: number;
  }>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (updates.length === 0) return;

      const rows = updates.map(update => {
        const row: any = {
          user_id: user.id,
          session_id: update.sessionId,
          table_id: update.tableId,
        };

        // Check if this is a tournament update (has level) or cash game update (has blinds)
        const isTournament = update.level !== undefined;
        const isCashGame = update.smallBlind !== undefined || update.bigBlind !== undefined;

        if (isTournament) {
          // For tournaments: ALL of level, stack, bb must be set (database constraint)
          row.level = update.level;
          row.stack = update.stack && update.stack !== '' ? parseInt(update.stack) : 0;
          row.bb = update.bb && update.bb !== '' ? parseInt(update.bb) : 0;
          // Ensure cash fields are null for constraint
          row.small_blind = null;
          row.big_blind = null;
        } else if (isCashGame) {
          // For cash games: both blinds must be set (database constraint)
          row.small_blind = update.smallBlind ?? 0;
          row.big_blind = update.bigBlind ?? 0;
          // Ensure tournament fields are null for constraint
          row.level = null;
          row.stack = null;
          row.bb = null;
        }

        return row;
      });

      const { error } = await supabase
        .from('table_bb_stack_updates')
        .insert(rows);

      if (error) {
        console.error('Error saving BB/Stack updates bulk:', error);
        throw error;
      }

      console.log('BB/Stack updates saved successfully in bulk:', rows.length, 'rows');
    } catch (error) {
      console.error('BBStackUpdateService.saveBBStackUpdatesBulk error:', error);
      throw error;
    }
  }

  static formatHistoryLine(update: BBStackUpdate, isLastUpdate: boolean = false): string {
    // For cash games - check for null values properly
    if (update.small_blind !== null && update.small_blind !== undefined && 
        update.big_blind !== null && update.big_blind !== undefined) {
      return `${update.small_blind}/${update.big_blind}`;
    }
    
    // For tournaments - show LVL X • BB Y format (user requested format)
    if (update.level !== null && update.level !== undefined && 
        update.bb !== null && update.bb !== undefined) {
      return `LVL ${update.level} • BB ${update.bb}`;
    }
    
    // If only level is available
    if (update.level !== null && update.level !== undefined) {
      return `LVL ${update.level}`;
    }
    
    return '';
  }
}