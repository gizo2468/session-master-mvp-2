
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/Lucide";

interface TutorialStep {
  id: number;
  title: string;
  description: string | null;
  image_path: string | null;
  step_order: number;
}

interface TutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const TutorialDialog = ({ open, onOpenChange, onComplete }: TutorialDialogProps) => {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch tutorial steps and filter out the "Log Your Hand Details" step
  useEffect(() => {
    const fetchTutorialSteps = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tutorial_steps')
          .select('*')
          .order('step_order', { ascending: true });
        
        if (error) {
          console.error('Error fetching tutorial steps:', error);
          toast({
            title: "Error",
            description: "Failed to load tutorial content. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        
        if (data) {
          // Filter out the "Log Your Hand Details" step
          const filteredSteps = data.filter(step => 
            !step.title.toLowerCase().includes('log your hand details') &&
            !step.title.toLowerCase().includes('hand details')
          );
          
          console.log('Tutorial steps fetched and filtered:', filteredSteps);
          setSteps(filteredSteps);
        }
      } catch (error) {
        console.error('Error in tutorial setup:', error);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchTutorialSteps();
    }
  }, [open, toast]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = async () => {
    try {
      if (user?.id) {
        // Update user profile to mark tutorial as completed and seen
        const { error } = await supabase
          .from('profiles')
          .update({ 
            has_completed_tutorial: true,
            has_seen_tutorial: true 
          })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating profile:', error);
          toast({
            title: "Warning",
            description: "Couldn't save your tutorial progress, but you can continue using the app.",
            variant: "default",
          });
        } else {
          toast({
            title: "Tutorial Completed",
            description: "Welcome to Session Master!",
            variant: "default",
          });
        }
      }

      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error marking tutorial as completed:', error);
    }
  };

  const handleSkip = async () => {
    // Mark as seen but not completed when skipped
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
    
    onOpenChange(false);
  };

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  
  // Calculate progress percentage
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  // Log current step for debugging
  useEffect(() => {
    if (currentStep && currentStep.image_path) {
      console.log('Current step image path:', currentStep.image_path);
    }
  }, [currentStep]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-auto">
        <DialogTitle className="sr-only">Tutorial</DialogTitle>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poker-gold"></div>
          </div>
        ) : (
          currentStep && (
            <div className="flex flex-col space-y-4">
              <div className="relative h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-poker-gold transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <h2 className="text-2xl font-bold text-center">{currentStep.title}</h2>
              
              {currentStep.description && (
                <p className="text-center text-gray-600">{currentStep.description}</p>
              )}
              
              {currentStep.image_path && (
                <div className="flex justify-center my-4">
                  <img 
                    src={currentStep.image_path} 
                    alt={`Tutorial step ${currentStepIndex + 1}`}
                    className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-md"
                    onError={(e) => {
                      console.error('Error loading image:', e);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <DialogFooter className="flex sm:justify-between flex-col sm:flex-row gap-2 pt-4">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevious}
                    disabled={currentStepIndex === 0}
                  >
                    <Icon name="ChevronLeft" className="mr-1" /> Previous
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleSkip}
                  >
                    Skip Tutorial
                  </Button>
                </div>
                
                <Button 
                  onClick={handleNext} 
                  variant="poker"
                >
                  {isLastStep ? 'Finish' : 'Next'} 
                  {!isLastStep && <Icon name="ChevronRight" className="ml-1" />}
                </Button>
              </DialogFooter>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TutorialDialog;
