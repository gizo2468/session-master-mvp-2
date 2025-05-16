
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Check if user has completed the tutorial
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
          .select('has_completed_tutorial')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching tutorial status:', error);
          setHasCompletedTutorial(true); // Default to true on error to avoid showing tutorial repeatedly
        } else {
          setHasCompletedTutorial(data.has_completed_tutorial);
          // Show tutorial automatically if user hasn't completed it
          if (data.has_completed_tutorial === false) {
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

  const completeTutorial = () => {
    setHasCompletedTutorial(true);
    setShowTutorial(false);
  };

  return {
    showTutorial,
    setShowTutorial,
    hasCompletedTutorial,
    isLoading,
    startTutorial,
    completeTutorial
  };
};
