import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSessionSharing = (sessionId: string) => {
  const { user } = useAuth();
  const { connectedCoaches } = useCoachStudent();
  const { toast } = useToast();
  const [isShared, setIsShared] = useState(false);
  const [sharedCoachId, setSharedCoachId] = useState<string | null>(null);
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
          .eq('player_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking sharing status:', error);
          return;
        }

        if (data) {
          setIsShared(true);
          setSharedCoachId(data.coach_id);
        } else {
          setIsShared(false);
          setSharedCoachId(null);
        }
      } catch (error) {
        console.error('Error in checkSharingStatus:', error);
      }
    };

    checkSharingStatus();
  }, [sessionId, user?.id]);

  const shareSession = async (coachId: string) => {
    if (!user?.id || !sessionId) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('shared_sessions')
        .insert({
          session_id: sessionId,
          player_id: user.id,
          coach_id: coachId
        });

      if (error) {
        console.error('Error sharing session:', error);
        toast({
          title: "Error",
          description: "Failed to share session with coach.",
          variant: "destructive"
        });
        return false;
      }

      setIsShared(true);
      setSharedCoachId(coachId);
      
      toast({
        title: "Session Shared",
        description: "Session has been shared with your coach."
      });
      
      return true;
    } catch (error) {
      console.error('Error in shareSession:', error);
      toast({
        title: "Error",
        description: "Failed to share session with coach.",
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

      setIsShared(false);
      setSharedCoachId(null);
      
      toast({
        title: "Session Unshared",
        description: "Session is no longer shared with coach."
      });
      
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
    isShared,
    sharedCoachId,
    connectedCoaches,
    loading,
    shareSession,
    unshareSession
  };
};