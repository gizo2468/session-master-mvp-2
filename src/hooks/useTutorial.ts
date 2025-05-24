
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState<boolean | null>(null);
  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Check if user has completed or seen the tutorial
  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('has_completed_tutorial, has_seen_tutorial')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching tutorial status:', error);
          setHasCompletedTutorial(true);
          setHasSeenTutorial(true);
        } else {
          console.log('Tutorial status:', data);
          setHasCompletedTutorial(data.has_completed_tutorial);
          setHasSeenTutorial(data.has_seen_tutorial);
          
          // Only show tutorial automatically if user has never seen it
          if (data.has_seen_tutorial === false || data.has_seen_tutorial === null) {
            setShowTutorial(true);
          }
        }
      } catch (error) {
        console.error('Error in tutorial check:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkTutorialStatus();
  }, [isAuthenticated, user?.id]);

  const startTutorial = () => {
    setShowTutorial(true);
  };

  const completeTutorial = async () => {
    setHasCompletedTutorial(true);
    setHasSeenTutorial(true);
    setShowTutorial(false);
    
    // Update database to mark both as completed and seen
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ 
            has_completed_tutorial: true,
            has_seen_tutorial: true 
          })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating tutorial completion:', error);
      }
    }
  };

  const markTutorialAsSeen = async () => {
    setHasSeenTutorial(true);
    
    // Mark as seen in database even if not completed
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ has_seen_tutorial: true })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error marking tutorial as seen:', error);
      }
    }
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    markTutorialAsSeen();
  };

  const resetTutorial = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({ 
          has_completed_tutorial: false,
          has_seen_tutorial: false 
        })
        .eq('id', user.id);
      
      setHasCompletedTutorial(false);
      setHasSeenTutorial(false);
      setShowTutorial(true);
    } catch (error) {
      console.error('Error resetting tutorial:', error);
    }
  };

  return {
    showTutorial,
    setShowTutorial: handleTutorialClose,
    hasCompletedTutorial,
    hasSeenTutorial,
    isLoading,
    startTutorial,
    completeTutorial,
    resetTutorial
  };
};
