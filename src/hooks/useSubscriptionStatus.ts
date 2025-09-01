import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  isPremium: boolean;
  subscription: {
    id: string;
    plan_type: 'monthly' | 'lifetime';
    status: string;
    start_date: string;
    end_date?: string;
    is_active: boolean;
  } | null;
}

export const useSubscriptionStatus = () => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke('verify-subscription-status');
      
      if (fetchError) {
        throw fetchError;
      }

      setSubscriptionData(data);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user]);

  const refreshSubscriptionStatus = () => {
    fetchSubscriptionStatus();
  };

  return {
    subscriptionData,
    isLoading,
    error,
    refreshSubscriptionStatus,
    isPremium: subscriptionData?.isPremium ?? false,
    subscription: subscriptionData?.subscription ?? null
  };
};

export default useSubscriptionStatus;