
import { supabase } from '@/integrations/supabase/client';

export interface UIStateData {
  [key: string]: any;
}

export interface UIStateEntry {
  id: string;
  user_id: string;
  screen_name: string;
  state_data: UIStateData;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export class UIStateService {
  /**
   * Save UI state for a specific screen
   */
  static async saveUIState(
    screenName: string,
    stateData: UIStateData,
    sessionId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ui_state')
        .upsert({
          screen_name: screenName,
          state_data: stateData,
          session_id: sessionId || null,
        }, {
          onConflict: 'user_id,screen_name,session_id'
        });

      if (error) {
        console.error('Error saving UI state:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveUIState:', error);
      return false;
    }
  }

  /**
   * Load UI state for a specific screen
   */
  static async loadUIState(
    screenName: string,
    sessionId?: string
  ): Promise<UIStateData | null> {
    try {
      const { data, error } = await supabase
        .from('ui_state')
        .select('state_data')
        .eq('screen_name', screenName)
        .eq('session_id', sessionId || null)
        .maybeSingle();

      if (error) {
        console.error('Error loading UI state:', error);
        return null;
      }

      return data?.state_data || null;
    } catch (error) {
      console.error('Error in loadUIState:', error);
      return null;
    }
  }

  /**
   * Update partial UI state for a specific screen
   */
  static async updateUIState(
    screenName: string,
    updates: Partial<UIStateData>,
    sessionId?: string
  ): Promise<boolean> {
    try {
      // First, get the current state
      const currentState = await this.loadUIState(screenName, sessionId);
      const newState = { ...currentState, ...updates };

      return await this.saveUIState(screenName, newState, sessionId);
    } catch (error) {
      console.error('Error in updateUIState:', error);
      return false;
    }
  }

  /**
   * Clear UI state for a specific screen
   */
  static async clearUIState(
    screenName: string,
    sessionId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ui_state')
        .delete()
        .eq('screen_name', screenName)
        .eq('session_id', sessionId || null);

      if (error) {
        console.error('Error clearing UI state:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clearUIState:', error);
      return false;
    }
  }

  /**
   * Get all UI states for the current user
   */
  static async getAllUIStates(sessionId?: string): Promise<UIStateEntry[]> {
    try {
      const query = supabase
        .from('ui_state')
        .select('*')
        .order('updated_at', { ascending: false });

      if (sessionId) {
        query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading all UI states:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllUIStates:', error);
      return [];
    }
  }

  /**
   * Clear all UI states for the current user (optional: for specific session)
   */
  static async clearAllUIStates(sessionId?: string): Promise<boolean> {
    try {
      const query = supabase
        .from('ui_state')
        .delete();

      if (sessionId) {
        query.eq('session_id', sessionId);
      }

      const { error } = await query;

      if (error) {
        console.error('Error clearing all UI states:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clearAllUIStates:', error);
      return false;
    }
  }
}
