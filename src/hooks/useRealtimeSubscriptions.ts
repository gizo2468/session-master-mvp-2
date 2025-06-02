
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useRealtimeSubscriptions = (
  onConnectionUpdate: () => void,
  isCoach: boolean,
  isStudent: boolean
) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up real-time subscription for user:', user.id, { isCoach, isStudent });

    const channel = supabase
      .channel('coach_student_connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_student_connections',
          filter: isCoach ? `coach_id=eq.${user.id}` : `student_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔄 Real-time connection event detected:', payload);
          
          // Delay to ensure database consistency
          setTimeout(() => {
            onConnectionUpdate();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('🔄 Real-time subscription status:', status);
      });

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, isCoach, isStudent, onConnectionUpdate]);
};
