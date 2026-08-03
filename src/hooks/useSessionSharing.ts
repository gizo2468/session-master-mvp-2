import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createNotification } from '@/services/notificationService';

export const useSessionSharing = (sessionId: string) => {
  const { user } = useAuth();
  const { connectedCoaches } = useCoachStudent();
  const { toast } = useToast();
  const [sharedCoaches, setSharedCoaches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if session is already shared
  useEffect(() => {
    const checkSharingStatus = async () => {
      if (!user?.id || !sessionId) return;

      try {
        const { data, error } = await supabase
          .from('shared_sessions')
          .select('coach_id')
          .eq('session_id', sessionId)
          .eq('player_id', user.id);

        if (error) {
          console.error('Error checking sharing status:', error);
          return;
        }

        if (data && data.length > 0) {
          setSharedCoaches(data.map(item => item.coach_id));
        } else {
          setSharedCoaches([]);
        }
      } catch (error) {
        console.error('Error in checkSharingStatus:', error);
      }
    };

    checkSharingStatus();
  }, [sessionId, user?.id]);

  const shareSession = async (coachIds: string[]) => {
    if (!user?.id || !sessionId) return false;

    setLoading(true);
    try {
      // Remove existing shares first to ensure clean state
      const { error: deleteError } = await supabase
        .from('shared_sessions')
        .delete()
        .eq('session_id', sessionId)
        .eq('player_id', user.id);

      if (deleteError) {
        console.error('Error removing existing shares:', deleteError);
        toast({
          title: "Error",
          description: "Failed to update session sharing.",
          variant: "destructive"
        });
        return false;
      }

      // If no coaches selected, just update state and return
      if (coachIds.length === 0) {
        setSharedCoaches([]);
        return true;
      }

      // Insert new shares for selected coaches
      const insertData = coachIds.map(coachId => ({
        session_id: sessionId,
        player_id: user.id,
        coach_id: coachId
      }));

      const { error: insertError } = await supabase
        .from('shared_sessions')
        .insert(insertData);

      if (insertError) {
        console.error('Error sharing session:', insertError);
        toast({
          title: "Error",
          description: "Failed to share session with coaches.",
          variant: "destructive"
        });
        return false;
      }

      // Verify the data was inserted correctly
      const { data: verificationData, error: verificationError } = await supabase
        .from('shared_sessions')
        .select('coach_id')
        .eq('session_id', sessionId)
        .eq('player_id', user.id);

      if (verificationError) {
        console.error('Error verifying share data:', verificationError);
      } else {
        const verifiedCoachIds = verificationData?.map(item => item.coach_id) || [];
        setSharedCoaches(verifiedCoachIds);
      }

      // Fetch player username for personalized notification
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      const playerUsername = profileData?.username || 'A player';

      // Create notifications for each coach
      for (const coachId of coachIds) {
        await createNotification({
          recipient_user_id: coachId,
          sender_user_id: user.id,
          type: 'session_shared',
          title: `${playerUsername} shared a game session with you`,
          body: 'A new game session is available for review',
          session_id: sessionId,
          hand_id: null
        });
      }

      
      return true;
    } catch (error) {
      console.error('Error in shareSession:', error);
      toast({
        title: "Error",
        description: "Failed to share session with coaches.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unshareSession = async () => {
    if (!user?.id || !sessionId) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('shared_sessions')
        .delete()
        .eq('session_id', sessionId)
        .eq('player_id', user.id);

      if (error) {
        console.error('Error unsharing session:', error);
        toast({
          title: "Error",
          description: "Failed to unshare session.",
          variant: "destructive"
        });
        return false;
      }

      setSharedCoaches([]);
      
      
      return true;
    } catch (error) {
      console.error('Error in unshareSession:', error);
      toast({
        title: "Error",
        description: "Failed to unshare session.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isShared: sharedCoaches.length > 0,
    sharedCoaches,
    connectedCoaches,
    loading,
    shareSession,
    unshareSession
  };
};