
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  actionType?: 'click' | 'navigation' | 'observe';
  actionDescription?: string;
  requiredPath?: string;
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
    actionType: "click",
    actionDescription: "Click the New Session button to continue",
    requiredPath: "/",
  },
  {
    id: 3,
    title: "Set Up Your Game",
    description: "Choose the game type you want to play. No Limit Hold'em is the most popular poker variant.",
    targetId: "nlh",
    position: "bottom",
    hasHighlight: true,
    actionType: "click",
    actionDescription: "Select No Limit Hold'em to continue",
    requiredPath: "/new-session",
  },
  {
    id: 4,
    title: "Add Tables",
    description: "During a session, you can add multiple tables to track. This includes cash games, tournaments, and more.",
    targetId: "add-table-feature",
    position: "bottom",
    hasHighlight: true,
    actionType: "click",
    actionDescription: "Click 'View All' to continue",
    requiredPath: "/",
  },
  {
    id: 5,
    title: "Live Timer",
    description: "The timer keeps track of your session duration automatically. This helps you monitor your playing time.",
    targetId: "live-timer-feature",
    position: "top",
    hasHighlight: true,
    actionType: "observe",
    actionDescription: "Observe the timer feature",
    requiredPath: "/",
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
  completeCurrentStepAction: () => void;
  isStepActionCompleted: boolean;
  isCurrentStepAvailable: boolean;
  checkStepAvailability: (path: string) => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};

export const TutorialProvider: React.FC<{ 
  children: React.ReactNode;
  currentPath?: string;
}> = ({ children, currentPath = '/' }) => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isStepActionCompleted, setIsStepActionCompleted] = useState(false);
  const [isCurrentStepAvailable, setIsCurrentStepAvailable] = useState(true);
  
  useEffect(() => {
    // First step (welcome modal) is always considered completed
    setIsStepActionCompleted(currentStepIndex === 0);
    console.log(`Tutorial step changed to ${currentStepIndex + 1}. Action required: ${TUTORIAL_STEPS[currentStepIndex]?.actionType || 'none'}`);
  }, [currentStepIndex]);
  
  // Check if the current step is available based on the current path
  const checkStepAvailability = (path: string) => {
    const currentStep = TUTORIAL_STEPS[currentStepIndex];
    
    if (currentStep && currentStep.requiredPath) {
      const isOnRequiredPath = path === currentStep.requiredPath;
      setIsCurrentStepAvailable(isOnRequiredPath);
      
      console.log(`Current path: ${path}, Required path: ${currentStep.requiredPath}, Available: ${isOnRequiredPath}`);
      
      if (!isOnRequiredPath && currentStep.actionType) {
        console.log(`Waiting for user to navigate to ${currentStep.requiredPath}`);
      }
    } else {
      setIsCurrentStepAvailable(true);
    }
  };
  
  // Use effect to check availability when currentPath changes
  useEffect(() => {
    checkStepAvailability(currentPath);
  }, [currentPath, currentStepIndex]);
  
  // Check if user is new on mount
  useEffect(() => {
    if (user?.isNewUser) {
      console.log("New user detected, starting tutorial");
      setIsActive(true);
      setCurrentStepIndex(0);
      setIsStepActionCompleted(true);
    }
  }, [user]);
  
  // Mark the current step's action as completed
  const completeCurrentStepAction = () => {
    console.log("Completing step action for step", currentStepIndex + 1);
    setIsStepActionCompleted(true);
    
    const currentStep = TUTORIAL_STEPS[currentStepIndex];
    if (currentStep && currentStep.actionType === 'click' && currentStep.requiredPath !== currentPath) {
      console.log(`Auto-advancing to next step after navigation action`);
      setTimeout(() => {
        nextStep();
      }, 500);
    }
  };
  
  // Add event listeners for target elements to detect interactions
  useEffect(() => {
    if (!isActive || isStepActionCompleted || !isCurrentStepAvailable) return;
    
    const currentStep = TUTORIAL_STEPS[currentStepIndex];
    if (!currentStep?.targetId || !currentStep.actionType) return;
    
    // If the element doesn't exist yet, try again shortly
    const targetElement = document.getElementById(currentStep.targetId);
    if (!targetElement) {
      console.log(`Target element with ID "${currentStep.targetId}" not found`);
      
      // Set up a retry mechanism
      const checkInterval = setInterval(() => {
        const element = document.getElementById(currentStep.targetId || '');
        if (element) {
          clearInterval(checkInterval);
          setupEventListener(element, currentStep.actionType || 'observe');
        }
      }, 500); // Check every 500ms
      
      // Clean up interval on unmount or step change
      return () => clearInterval(checkInterval);
    }
    
    // If element exists, set up the listener immediately
    return setupEventListener(targetElement, currentStep.actionType);
  }, [isActive, currentStepIndex, isStepActionCompleted, isCurrentStepAvailable, currentPath]);
  
  const setupEventListener = (targetElement: HTMLElement, actionType: string) => {
    console.log(`Adding "${actionType}" listener to element with ID "${targetElement.id}"`);
    
    const handleInteraction = () => {
      console.log(`User interacted with element ID "${targetElement.id}"`);
      completeCurrentStepAction();
    };
    
    if (actionType === 'click') {
      targetElement.addEventListener('click', handleInteraction);
    } else if (actionType === 'observe') {
      // For 'observe' type, we auto-complete after a short delay
      const timer = setTimeout(handleInteraction, 2000);
      return () => clearTimeout(timer);
    }
    
    return () => {
      if (actionType === 'click') {
        targetElement.removeEventListener('click', handleInteraction);
      }
    };
  };
  
  const nextStep = () => {
    console.log("Next step called. Current index:", currentStepIndex);
    
    if (!isStepActionCompleted && currentStepIndex !== 0) {
      console.log("Cannot proceed - current step action not completed");
      toast({
        title: "Complete the action first",
        description: TUTORIAL_STEPS[currentStepIndex]?.actionDescription || "Complete the current step's action to continue",
        variant: "default",
      });
      return;
    }
    
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(prevIndex => prevIndex + 1);
      setIsStepActionCompleted(false);
    } else {
      completeTutorial();
    }
  };
  
  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prevIndex => prevIndex - 1);
      setIsStepActionCompleted(true);
    }
  };
  
  const startTutorial = () => {
    setCurrentStepIndex(0);
    setIsStepActionCompleted(true);
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
      console.log(`Updating user ${user.id} is_new_user status to: ${isNewUser}`);
      
      const { error, data } = await supabase
        .from('profiles')
        .update({ is_new_user: isNewUser })
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error("Supabase error updating tutorial status:", error);
        throw error;
      }
      
      console.log("Supabase update response:", data);
      
      // Update local user state
      updateUser({ isNewUser });
      
      // Verify the update worked
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('is_new_user')
        .eq('id', user.id)
        .single();
      
      if (verifyError) {
        console.error("Error verifying tutorial status update:", verifyError);
      } else {
        console.log("Verified tutorial status in database:", verifyData);
      }
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
    completeCurrentStepAction,
    isStepActionCompleted,
    isCurrentStepAvailable,
    checkStepAvailability,
  };
  
  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export default TutorialContext;
