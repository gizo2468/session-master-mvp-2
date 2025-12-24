
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Hook for real-time subscriptions - simplified to avoid hook count issues
export const useRealtimeSubscriptions = (
  onConnectionUpdate: () => void,
  isCoach: boolean,
  isStudent: boolean,
  userId?: string | null,
  isAuthenticated?: boolean
) => {
  const channelRef = useRef<any>(null);
  
  // Memoize the callback to prevent unnecessary subscription recreations
  const stableCallback = useCallback(() => {
    onConnectionUpdate();
  }, [onConnectionUpdate]);

  useEffect(() => {
    // Clean up previous subscription first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Only set up subscription if user is authenticated and has a coach/student role
    if (!isAuthenticated || !userId || (!isCoach && !isStudent)) {
      return;
    }

    console.log('🔄 Setting up real-time subscription for user:', userId, { isCoach, isStudent });

    const channelName = `coach_student_connections_${userId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_student_connections',
          filter: isCoach ? `coach_id=eq.${userId}` : `student_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('🔄 Real-time connection event detected:', payload.eventType);
          
          // Add delay to ensure database consistency before refreshing
          setTimeout(() => {
            stableCallback();
          }, 500);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, isCoach, isStudent, isAuthenticated, stableCallback]);
};
