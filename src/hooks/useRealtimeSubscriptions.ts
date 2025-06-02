
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionConfig {
  table: string;
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
  callback: (payload: any) => void;
}

export const useRealtimeSubscriptions = (
  subscriptions: SubscriptionConfig[],
  dependencies: any[] = []
) => {
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    // Cleanup existing subscriptions
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    if (subscriptions.length === 0) {
      return;
    }

    console.log('🔄 Setting up realtime subscriptions:', subscriptions.map(s => s.table));

    // Create new subscriptions
    subscriptions.forEach((config, index) => {
      const channelName = `${config.table}-${index}-${Date.now()}`;
      
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: config.event,
          schema: 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter })
        }, (payload) => {
          console.log(`🔔 Realtime update for ${config.table}:`, payload);
          config.callback(payload);
        })
        .subscribe((status) => {
          console.log(`📡 Subscription status for ${config.table}:`, status);
        });

      channelsRef.current.push(channel);
    });

    return () => {
      console.log('🧹 Cleaning up realtime subscriptions');
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, dependencies);

  return {
    subscriptionCount: channelsRef.current.length,
    cleanup: () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    }
  };
};
