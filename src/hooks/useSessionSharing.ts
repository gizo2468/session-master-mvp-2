import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConnectedPerson {
  id: string;
  full_name: string;
  email: string;
}

export const useSessionSharing = (sessionId: string, userId: string) => {
  const [isShared, setIsShared] = useState(false);
  const [connectedPeople, setConnectedPeople] = useState<ConnectedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'student' | 'coach' | null>(null);
  const { toast } = useToast();

  // Fetch connected people and current sharing status
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId || !userId) return;
      
      try {
        setIsLoading(true);

        // First, get the user's role
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          return;
        }

        const currentUserRole = userProfile?.role as 'student' | 'coach';
        setUserRole(currentUserRole);

        let connections;
        let connectionError;

        if (currentUserRole === 'student') {
          // Student: get connected coaches
          const { data, error } = await supabase
            .from('coach_student_connections')
            .select('coach_id')
            .eq('student_id', userId)
            .eq('status', 'accepted');
          
          connections = data;
          connectionError = error;
        } else {
          // Coach: get connected students
          const { data, error } = await supabase
            .from('coach_student_connections')
            .select('student_id')
            .eq('coach_id', userId)
            .eq('status', 'accepted');
          
          connections = data;
          connectionError = error;
        }

        if (connectionError) {
          console.error('Error fetching connections:', connectionError);
          return;
        }

        if (!connections || connections.length === 0) {
          setConnectedPeople([]);
          setIsLoading(false);
          return;
        }

        // Get profiles of connected people
        const personIds = connections.map(conn => 
          currentUserRole === 'student' ? conn.coach_id : conn.student_id
        );
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', personIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        const people = profiles?.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || 'Unknown',
          email: profile.email || ''
        })) || [];

        setConnectedPeople(people);

        // Check if session is currently shared
        if (people.length > 0) {
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
    if (!sessionId || !userId || connectedPeople.length === 0) {
      const roleName = userRole === 'student' ? 'coaches' : 'students';
      toast({
        title: `No ${roleName} connected`,
        description: `You need to connect with ${roleName} before sharing sessions.`,
        variant: "destructive"
      });
      return;
    }

    try {
      if (shouldShare) {
        // Create shared_sessions records for each connected person
        // For students: share with coaches, For coaches: share with students
        const sharedSessionsData = connectedPeople.map(person => ({
          session_id: sessionId,
          player_id: userId,
          coach_id: userRole === 'student' ? person.id : userId
        }));

        const { error } = await supabase
          .from('shared_sessions')
          .insert(sharedSessionsData);

        if (error) {
          console.error('Error sharing session:', error);
          toast({
            title: "Failed to share session",
            description: "There was an error sharing your session.",
            variant: "destructive"
          });
          return;
        }

        setIsShared(true);
        const roleText = userRole === 'student' ? 'coach' : 'student';
        toast({
          title: "Session shared",
          description: `Session shared with ${connectedPeople.length} ${roleText}${connectedPeople.length > 1 ? 's' : ''}.`
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
          description: "Session is no longer shared."
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
    connectedPeople,
    isLoading,
    toggleSharing,
    userRole
  };
};