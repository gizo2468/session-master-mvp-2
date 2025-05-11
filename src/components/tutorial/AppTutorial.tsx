
import React, { useEffect, useState } from 'react';
import { useTutorial, TutorialStep } from '@/context/TutorialContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { useLanguage } from '@/context/LanguageContext';
import Icon from '@/components/ui/Lucide';

/**
 * Get the element position for the tutorial highlight
 */
const getElementPosition = (elementId: string | undefined) => {
  if (!elementId) return null;
  
  const element = document.getElementById(elementId);
  if (!element) return null;
  
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };
};

/**
 * TutorialHighlight component to highlight a specific element
 */
const TutorialHighlight: React.FC<{ 
  elementId: string | undefined;
  position: 'top' | 'bottom' | 'left' | 'right' | undefined;
  children: React.ReactNode;
}> = ({ elementId, position = 'bottom', children }) => {
  const [elementPosition, setElementPosition] = useState<any>(null);
  
  useEffect(() => {
    if (!elementId) return;
    
    const updatePosition = () => {
      setElementPosition(getElementPosition(elementId));
    };
    
    // Initial position
    updatePosition();
    
    // Update position on resize and scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [elementId]);
  
  if (!elementPosition) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Semi-transparent overlay that allows clicking through on the highlighted element */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" />
      
      {/* Create a "hole" in the overlay for the highlighted element */}
      <div 
        className="absolute bg-transparent pointer-events-auto"
        style={{
          top: `${elementPosition.top}px`,
          left: `${elementPosition.left}px`,
          width: `${elementPosition.width}px`,
          height: `${elementPosition.height}px`,
        }}
      />
      
      {/* Highlight border */}
      <div 
        className="absolute border-2 border-poker-gold rounded-md shadow-lg pointer-events-none" 
        style={{
          top: `${elementPosition.top}px`,
          left: `${elementPosition.left}px`,
          width: `${elementPosition.width}px`,
          height: `${elementPosition.height}px`,
        }}
      />
      
      {/* Tooltip content */}
      <div 
        className="absolute bg-white rounded-md shadow-lg border border-gray-200 p-4 z-50 max-w-sm pointer-events-auto"
        style={{
          ...(position === 'top' && {
            bottom: `calc(100% - ${elementPosition.top}px + 10px)`,
            left: `${elementPosition.left + elementPosition.width / 2}px`,
            transform: 'translateX(-50%)',
          }),
          ...(position === 'bottom' && {
            top: `${elementPosition.top + elementPosition.height + 10}px`,
            left: `${elementPosition.left + elementPosition.width / 2}px`,
            transform: 'translateX(-50%)',
          }),
          ...(position === 'left' && {
            right: `calc(100% - ${elementPosition.left}px + 10px)`,
            top: `${elementPosition.top + elementPosition.height / 2}px`,
            transform: 'translateY(-50%)',
          }),
          ...(position === 'right' && {
            left: `${elementPosition.left + elementPosition.width + 10}px`,
            top: `${elementPosition.top + elementPosition.height / 2}px`,
            transform: 'translateY(-50%)',
          }),
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * StepContent component to display the step content
 */
const StepContent: React.FC<{ step: TutorialStep }> = ({ step }) => {
  const { t } = useLanguage();
  const { nextStep, prevStep, skipTutorial, totalSteps, isStepActionCompleted } = useTutorial();
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-poker-black">{step.title}</h3>
      <p className="text-gray-600">{step.description}</p>
      
      {step.actionType && !isStepActionCompleted && (
        <div className="mt-2 bg-yellow-50 p-2 rounded-md border border-yellow-200">
          <p className="text-sm text-yellow-800 flex items-center">
            <Icon name="Info" className="mr-1 h-4 w-4" />
            {step.actionDescription || `Complete the action to continue`}
          </p>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          {t('step')} {step.id} {t('of')} {totalSteps}
        </div>
        <div className="flex space-x-2">
          {step.id > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={prevStep}
            >
              <Icon name="ArrowLeft" className="mr-1 h-4 w-4" />
              {t('back')}
            </Button>
          )}
          <Button 
            variant="poker" 
            size="sm"
            onClick={nextStep}
            disabled={step.actionType && !isStepActionCompleted && step.id !== 1}
          >
            {step.id === totalSteps ? t('finish') : (isStepActionCompleted ? t('next') : t('proceed'))}
            {step.id !== totalSteps && isStepActionCompleted && <Icon name="ArrowRight" className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <button 
        onClick={() => skipTutorial()}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors mt-2"
      >
        {t('skip_tutorial')}
      </button>
    </div>
  );
};

/**
 * Main AppTutorial component
 */
const AppTutorial: React.FC = () => {
  const { isActive, currentStep } = useTutorial();
  
  if (!isActive) return null;
  
  // Show welcome modal for first step
  if (currentStep.isModal) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="sr-only">{currentStep.title}</DialogTitle>
          <div className="space-y-4 p-2">
            <h2 className="text-xl font-bold text-poker-black text-center">
              {currentStep.title}
            </h2>
            <p className="text-center text-gray-600">
              {currentStep.description}
            </p>
            <StepContent step={currentStep} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Show tooltip highlight for other steps
  if (currentStep.hasHighlight && currentStep.targetId) {
    return (
      <TutorialHighlight 
        elementId={currentStep.targetId} 
        position={currentStep.position}
      >
        <StepContent step={currentStep} />
      </TutorialHighlight>
    );
  }
  
  // Fallback to using AdaptiveTooltip if no specific rendering is needed
  return (
    <AdaptiveTooltip
      content={<StepContent step={currentStep} />}
      className="z-50"
    >
      <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <StepContent step={currentStep} />
      </div>
    </AdaptiveTooltip>
  );
};

export default AppTutorial;
