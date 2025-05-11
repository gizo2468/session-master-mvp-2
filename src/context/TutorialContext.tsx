
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type TutorialStep = {
  id: number;
  title: string;
  description: string;
  targetId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  hasHighlight?: boolean;
  isModal?: boolean;
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to PokerTracker",
    description: "This quick tutorial will guide you through the main features of the app. Let's get started!",
    isModal: true,
  },
  {
    id: 2,
    title: "Start a Session",
    description: "Click this button to start tracking a new poker session. You'll be able to add tables and track your progress.",
    targetId: "new-session-button",
    position: "bottom",
    hasHighlight: true,
  },
  {
    id: 3,
    title: "Add Tables",
    description: "During a session, you can add multiple tables to track. This includes cash games, tournaments, and more.",
    targetId: "add-table-feature",
    position: "bottom",
    hasHighlight: true,
  },
  {
    id: 4,
    title: "Live Timer",
    description: "The timer keeps track of your session duration automatically. This helps you monitor your playing time.",
    targetId: "live-timer-feature",
    position: "top",
    hasHighlight: true,
  },
  {
    id: 5,
    title: "End Session",
    description: "When you're done playing, end your session to save your results and review your performance.",
    targetId: "end-session-feature",
    position: "bottom",
    hasHighlight: true,
  },
];

type TutorialContextType = {
  isActive: boolean;
  currentStep: TutorialStep;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => Promise<void>;
  completeTutorial: () => Promise<void>;
  startTutorial: () => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Check if user is new on mount
  useEffect(() => {
    if (user?.isNewUser) {
      setIsActive(true);
      // Start with the first step
      setCurrentStepIndex(0);
    }
  }, [user]);
  
  // Debug logs to help diagnose issues
  useEffect(() => {
    if (isActive) {
      console.log("Tutorial is active. Current step:", currentStepIndex + 1);
      console.log("Current step details:", TUTORIAL_STEPS[currentStepIndex]);
    }
  }, [isActive, currentStepIndex]);
  
  const nextStep = () => {
    console.log("Next step called. Current index:", currentStepIndex);
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(prevIndex => {
        console.log("Updating step index from", prevIndex, "to", prevIndex + 1);
        return prevIndex + 1;
      });
    } else {
      completeTutorial();
    }
  };
  
  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prevIndex => prevIndex - 1);
    }
  };
  
  const startTutorial = () => {
    setCurrentStepIndex(0);
    setIsActive(true);
  };
  
  const skipTutorial = async () => {
    try {
      await updateTutorialStatus(false);
      setIsActive(false);
      toast({
        title: "Tutorial skipped",
        description: "You can restart it anytime from settings",
      });
    } catch (error) {
      console.error("Error skipping tutorial:", error);
      toast({
        title: "Error",
        description: "Failed to skip tutorial",
        variant: "destructive",
      });
    }
  };
  
  const completeTutorial = async () => {
    try {
      await updateTutorialStatus(false);
      setIsActive(false);
      toast({
        title: "Tutorial completed",
        description: "You've completed the tutorial! You can restart it anytime from settings",
      });
    } catch (error) {
      console.error("Error completing tutorial:", error);
      toast({
        title: "Error",
        description: "Failed to complete tutorial",
        variant: "destructive",
      });
    }
  };
  
  const updateTutorialStatus = async (isNewUser: boolean) => {
    if (!user) return;
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ is_new_user: isNewUser })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local user state
      updateUser({ isNewUser });
    } catch (error) {
      console.error("Error updating tutorial status:", error);
      throw error;
    }
  };
  
  const value = {
    isActive,
    currentStep: TUTORIAL_STEPS[currentStepIndex],
    totalSteps: TUTORIAL_STEPS.length,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    startTutorial,
  };
  
  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export default TutorialContext;
