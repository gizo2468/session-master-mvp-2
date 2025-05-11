
import React, { useEffect, useState } from 'react';
import { useTutorial, TutorialStep } from '@/context/TutorialContext';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
    isCircular: element.classList.contains('rounded-full'),
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
  
  // Use the isCircular property to determine border radius
  const borderRadius = elementPosition.isCircular ? '9999px' : '8px';
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Semi-transparent overlay that blocks all clicks */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" />
      
      {/* Create a "hole" in the overlay for the highlighted element */}
      <div 
        className="absolute bg-transparent pointer-events-none"
        style={{
          top: `${elementPosition.top}px`,
          left: `${elementPosition.left}px`,
          width: `${elementPosition.width}px`,
          height: `${elementPosition.height}px`,
          borderRadius: borderRadius,
        }}
      />
      
      {/* Make only the highlighted element clickable */}
      <div
        className="absolute"
        style={{
          top: `${elementPosition.top}px`,
          left: `${elementPosition.left}px`,
          width: `${elementPosition.width}px`,
          height: `${elementPosition.height}px`,
          pointerEvents: 'auto',
          cursor: 'pointer',
          zIndex: 60,
          borderRadius: borderRadius,
        }}
        onClick={(e) => {
          // Allow the click to pass through to the actual element
          const element = document.getElementById(elementId || '');
          if (element) {
            // Simulate a click on the actual element
            element.click();
          }
          e.stopPropagation();
        }}
      />
      
      {/* Highlight border */}
      <div 
        className="absolute border-2 border-poker-gold shadow-lg animate-pulse pointer-events-none" 
        style={{
          top: `${elementPosition.top - 4}px`,
          left: `${elementPosition.left - 4}px`,
          width: `${elementPosition.width + 8}px`,
          height: `${elementPosition.height + 8}px`,
          borderRadius: borderRadius,
          boxShadow: '0 0 15px 5px rgba(212, 175, 55, 0.5)',
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
  const { nextStep, prevStep, skipTutorial, isStepActionCompleted } = useTutorial();
  
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
          {/* Only show the Next button if no action is required or if the action is completed */}
          {(!step.actionType || isStepActionCompleted) && (
            <Button 
              variant="poker" 
              size="sm"
              onClick={nextStep}
            >
              {step.id === 5 ? t('finish') : t('next')}
              {step.id !== 5 && <Icon name="ArrowRight" className="ml-1 h-4 w-4" />}
            </Button>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={skipTutorial}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t('skip')}
        </Button>
      </div>
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
          <DialogTitle>{currentStep.title}</DialogTitle>
          <DialogDescription>{currentStep.description}</DialogDescription>
          <div className="space-y-4 p-2">
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
