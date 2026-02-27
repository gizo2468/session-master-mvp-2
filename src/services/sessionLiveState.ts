
import { supabase } from '@/integrations/supabase/client';

export interface SessionLiveStateData {
  activeTab?: string;
  scrollY?: number;
  filters?: any;
  modalStates?: Record<string, boolean>;
  formData?: any;
  bbStackUpdates?: {
    [tableId: string]: {
      // Tournament fields
      level?: number;
      stack?: string;
      bb?: string;
      // Cash game fields
      smallBlind?: number;
      bigBlind?: number;
      stackBB?: string;
    };
  };
  [key: string]: any;
}

export class SessionLiveStateService {
  private static debounceTimers = new Map<string, NodeJS.Timeout>();
  private static readonly DEBOUNCE_DELAY = 1000; // 1 second

  static async saveState(
    sessionId: string,
    stateData: SessionLiveStateData
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('session_live_state')
        .upsert({
          session_id: sessionId,
          user_id: user.id,
          state: stateData as any,
        }, {
          onConflict: 'session_id,user_id'
        });

      if (error) {
        console.error('Error saving session live state:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveState:', error);
      return false;
    }
  }

  static async loadState(sessionId: string): Promise<SessionLiveStateData | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('session_live_state')
        .select('state')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading session live state:', error);
        return null;
      }

      return (data?.state as SessionLiveStateData) || null;
    } catch (error) {
      console.error('Error in loadState:', error);
      return null;
    }
  }

  static debouncedSaveState(
    sessionId: string,
    stateData: SessionLiveStateData
  ): void {
    const key = sessionId;
    
    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.saveState(sessionId, stateData);
      this.debounceTimers.delete(key);
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(key, timer);
  }

  static async clearState(sessionId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('session_live_state')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing session live state:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clearState:', error);
      return false;
    }
  }
}
