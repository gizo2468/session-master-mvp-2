
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useRealtimeSubscriptions = (
  onConnectionUpdate: () => void,
  isCoach: boolean,
  isStudent: boolean
) => {
  const { user, isAuthenticated } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Clean up previous subscription first
    if (channelRef.current) {
      console.log('🔄 Cleaning up previous real-time subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Only set up subscription if user is authenticated and has a coach/student role
    if (!isAuthenticated || !user?.id || (!isCoach && !isStudent)) {
      console.log('🔄 Skipping real-time subscription - not authenticated or no role');
      return;
    }

    console.log('🔄 Setting up real-time subscription for user:', user.id, { isCoach, isStudent });

    const channelName = `coach_student_connections_${user.id}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_student_connections',
          filter: isCoach ? `coach_id=eq.${user.id}` : `student_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔄 Real-time connection event detected:', payload.eventType, payload);
          
          // Add delay to ensure database consistency before refreshing
          setTimeout(() => {
            console.log('🔄 Triggering connection update callback');
            onConnectionUpdate();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('🔄 Real-time subscription status:', status, 'for channel:', channelName);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log('🔄 Cleaning up real-time subscription on unmount');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, isCoach, isStudent, isAuthenticated, onConnectionUpdate]);
};
