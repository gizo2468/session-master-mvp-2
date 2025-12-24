import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const STACK_CHECK_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 25, label: '25 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: null, label: 'Never' },
] as const;

export type StackCheckIntervalValue = number | null;

export const useStackCheckInterval = () => {
  const { user } = useAuth();
  const [interval, setInterval] = useState<StackCheckIntervalValue>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch interval on mount
  useEffect(() => {
    const fetchInterval = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('stack_check_interval')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching stack check interval:', error);
        } else if (data) {
          setInterval(data.stack_check_interval);
        }
      } catch (error) {
        console.error('Error fetching stack check interval:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterval();
  }, [user?.id]);

  // Update interval
  const updateInterval = useCallback(async (newInterval: StackCheckIntervalValue): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ stack_check_interval: newInterval })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating stack check interval:', error);
        return false;
      }

      setInterval(newInterval);
      return true;
    } catch (error) {
      console.error('Error updating stack check interval:', error);
      return false;
    }
  }, [user?.id]);

  return {
    interval,
    updateInterval,
    isLoading,
  };
};
