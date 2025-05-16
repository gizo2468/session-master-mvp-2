
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
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
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch tutorial steps
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
          setSteps(data);
          
          // Fetch image URLs for each step with an image_path
          const urlPromises = data
            .filter(step => step.image_path)
            .map(async (step) => {
              if (!step.image_path) return null;
              
              try {
                const { data } = await supabase
                  .storage
                  .from('tutorial_images')
                  .getPublicUrl(step.image_path.replace('tutorial_images/', ''));
                
                return { path: step.image_path, url: data.publicUrl };
              } catch (error) {
                console.error(`Error getting URL for ${step.image_path}:`, error);
                return null;
              }
            });
            
          const urls = await Promise.all(urlPromises);
          const urlMap: Record<string, string> = {};
          
          urls.forEach(item => {
            if (item) {
              urlMap[item.path] = item.url;
            }
          });
          
          setImageUrls(urlMap);
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
        // Update user profile to mark tutorial as completed
        const { error } = await supabase
          .from('profiles')
          .update({ has_completed_tutorial: true })
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

  const handleSkip = () => {
    handleComplete();
  };

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  
  // Calculate progress percentage
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-auto">
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
              
              {currentStep.image_path && imageUrls[currentStep.image_path] && (
                <div className="flex justify-center my-4">
                  <img 
                    src={imageUrls[currentStep.image_path]} 
                    alt={`Tutorial step ${currentStepIndex + 1}`}
                    className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-md"
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
