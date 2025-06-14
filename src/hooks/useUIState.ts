
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UIStateData {
  [key: string]: any;
}

interface UIStateEntry {
  id: string;
  user_id: string;
  screen_name: string;
  state_data: UIStateData;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useUIState = (screenName: string, sessionId?: string) => {
  const [state, setState] = useState<UIStateData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load state from database on mount
  useEffect(() => {
    loadState();
  }, [screenName, sessionId]);

  const loadState = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ui_state')
        .select('*')
        .eq('screen_name', screenName)
        .eq('session_id', sessionId || null)
        .maybeSingle();

      if (fetchError) {
        console.error('Error loading UI state:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        setState(data.state_data || {});
      }
    } catch (err) {
      console.error('Error in loadState:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveState = useCallback(async (newState: UIStateData) => {
    try {
      setError(null);

      const { error: upsertError } = await supabase
        .from('ui_state')
        .upsert({
          screen_name: screenName,
          state_data: newState,
          session_id: sessionId || null,
        }, {
          onConflict: 'user_id,screen_name,session_id'
        });

      if (upsertError) {
        console.error('Error saving UI state:', upsertError);
        setError(upsertError.message);
        return false;
      }

      setState(newState);
      return true;
    } catch (err) {
      console.error('Error in saveState:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [screenName, sessionId]);

  const updateState = useCallback(async (updates: Partial<UIStateData>) => {
    const newState = { ...state, ...updates };
    return await saveState(newState);
  }, [state, saveState]);

  const clearState = useCallback(async () => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('ui_state')
        .delete()
        .eq('screen_name', screenName)
        .eq('session_id', sessionId || null);

      if (deleteError) {
        console.error('Error clearing UI state:', deleteError);
        setError(deleteError.message);
        return false;
      }

      setState({});
      return true;
    } catch (err) {
      console.error('Error in clearState:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [screenName, sessionId]);

  return {
    state,
    isLoading,
    error,
    saveState,
    updateState,
    clearState,
    loadState,
  };
};
