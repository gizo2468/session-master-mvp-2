import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConnectedCoach {
  id: string;
  full_name: string;
  email: string;
}

export const useSessionSharing = (sessionId: string, userId: string) => {
  const [isShared, setIsShared] = useState(false);
  const [connectedCoaches, setConnectedCoaches] = useState<ConnectedCoach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch connected coaches and current sharing status
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId || !userId) return;
      
      try {
        setIsLoading(true);

        // Get connected coaches
        const { data: connections, error: connectionsError } = await supabase
          .from('coach_student_connections')
          .select('coach_id')
          .eq('student_id', userId)
          .eq('status', 'accepted');

        if (connectionsError) {
          console.error('Error fetching connected coaches:', connectionsError);
          return;
        }

        if (!connections || connections.length === 0) {
          setConnectedCoaches([]);
          setIsLoading(false);
          return;
        }

        // Get coach profiles
        const coachIds = connections.map(conn => conn.coach_id);
        const { data: coachProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', coachIds);

        if (profilesError) {
          console.error('Error fetching coach profiles:', profilesError);
          return;
        }

        const coaches = coachProfiles?.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || 'Unknown Coach',
          email: profile.email || ''
        })) || [];

        setConnectedCoaches(coaches);

        // Check if session is currently shared
        if (coaches.length > 0) {
          const { data: sharedSessions, error: sharingError } = await supabase
            .from('shared_sessions')
            .select('id')
            .eq('session_id', sessionId)
            .eq('player_id', userId);

          if (sharingError) {
            console.error('Error checking sharing status:', sharingError);
            return;
          }

          setIsShared((sharedSessions?.length || 0) > 0);
        }
      } catch (error) {
        console.error('Error in useSessionSharing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId, userId]);

  const toggleSharing = async (shouldShare: boolean) => {
    if (!sessionId || !userId || connectedCoaches.length === 0) {
      toast({
        title: "No coaches connected",
        description: "You need to connect with coaches before sharing sessions.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (shouldShare) {
        // Create shared_sessions records for each connected coach
        const sharedSessionsData = connectedCoaches.map(coach => ({
          session_id: sessionId,
          player_id: userId,
          coach_id: coach.id
        }));

        const { error } = await supabase
          .from('shared_sessions')
          .insert(sharedSessionsData);

        if (error) {
          console.error('Error sharing session:', error);
          toast({
            title: "Failed to share session",
            description: "There was an error sharing your session with coaches.",
            variant: "destructive"
          });
          return;
        }

        setIsShared(true);
        toast({
          title: "Session shared",
          description: `Session shared with ${connectedCoaches.length} coach${connectedCoaches.length > 1 ? 'es' : ''}.`
        });
      } else {
        // Remove shared_sessions records for this session
        const { error } = await supabase
          .from('shared_sessions')
          .delete()
          .eq('session_id', sessionId)
          .eq('player_id', userId);

        if (error) {
          console.error('Error unsharing session:', error);
          toast({
            title: "Failed to unshare session",
            description: "There was an error removing session sharing.",
            variant: "destructive"
          });
          return;
        }

        setIsShared(false);
        toast({
          title: "Session unshared",
          description: "Session is no longer shared with coaches."
        });
      }
    } catch (error) {
      console.error('Error toggling session sharing:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  return {
    isShared,
    connectedCoaches,
    isLoading,
    toggleSharing
  };
};