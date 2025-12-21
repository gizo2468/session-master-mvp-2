import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check, SkipForward } from 'lucide-react';
import type { PlayerCardData, PlayerPrivateData, Achievement } from '@/hooks/usePlayerCard';

interface ProfileOnboardingFlowProps {
  cardData: PlayerCardData | null;
  privateData: PlayerPrivateData | null;
  onUpdateCard: (updates: Partial<PlayerCardData>) => void;
  onUpdatePrivate: (updates: Partial<{ full_name: string }>) => void;
  onComplete: () => void;
  isSaving: boolean;
}

type GameFormat = 'cash' | 'tournaments' | 'both';

const TOTAL_STEPS = 4;

export function ProfileOnboardingFlow({
  cardData,
  privateData,
  onUpdateCard,
  onUpdatePrivate,
  onComplete,
  isSaving
}: ProfileOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Local form state
  const [displayName, setDisplayName] = useState(privateData?.full_name || '');
  const [gameFormat, setGameFormat] = useState<GameFormat>(cardData?.primary_format || 'both');
  const [specialization, setSpecialization] = useState(cardData?.specialization || '');
  const [workingOn, setWorkingOn] = useState(cardData?.improvement_goals || '');
  const [achievementTitle, setAchievementTitle] = useState('');

  const formatLabels = {
    cash: 'Cash Games',
    tournaments: 'Tournaments',
    both: 'Cash & MTT'
  };

  const handleNext = () => {
    // Save data for current step before moving on
    if (currentStep === 1) {
      if (displayName.trim()) {
        onUpdatePrivate({ full_name: displayName.trim() });
      }
      onUpdateCard({ primary_format: gameFormat });
    } else if (currentStep === 2) {
      onUpdateCard({ specialization: specialization.trim() });
    } else if (currentStep === 3) {
      onUpdateCard({ improvement_goals: workingOn.trim() });
    }
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Save final step data and complete
    if (currentStep === 4 && achievementTitle.trim()) {
      const newAchievement: Achievement = {
        id: crypto.randomUUID(),
        title: achievementTitle.trim(),
        icon: '🏆'
      };
      onUpdateCard({ 
        achievements: [...(cardData?.achievements || []), newAchievement] 
      });
    }
    onComplete();
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const renderStepIndicators = () => (
    <div className="flex justify-center gap-2 mb-6">
      {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
        <div
          key={index}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            index + 1 === currentStep
              ? 'bg-poker-gold scale-125'
              : index + 1 < currentStep
              ? 'bg-poker-gold/60'
              : 'bg-zinc-600'
          }`}
        />
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Basic Identity</h3>
        <p className="text-sm text-zinc-400">How should we know you?</p>
      </div>
      
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
          Display Name
        </label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name or nickname"
          className="bg-zinc-700 border-poker-gold/40 text-white"
          maxLength={50}
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
          Game Focus
        </label>
        <div className="flex gap-2 flex-wrap">
          {(['cash', 'tournaments', 'both'] as const).map((format) => (
            <Badge
              key={format}
              variant={gameFormat === format ? 'default' : 'outline'}
              className={`cursor-pointer transition-all py-2 px-3 ${
                gameFormat === format
                  ? 'bg-poker-gold text-black hover:bg-poker-darkGold'
                  : 'border-poker-gold/40 text-zinc-400 hover:border-poker-gold hover:text-white'
              }`}
              onClick={() => setGameFormat(format)}
            >
              {formatLabels[format]}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Specialization</h3>
        <p className="text-sm text-zinc-400">What's your poker specialty?</p>
      </div>
      
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
          Your Specialization
        </label>
        <Input
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder="e.g., NLH Cash Game Specialist"
          className="bg-zinc-700 border-poker-gold/40 text-white"
          maxLength={100}
        />
        <p className="text-xs text-zinc-500 mt-2">
          Describe your main focus or expertise in poker
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Currently Working On</h3>
        <p className="text-sm text-zinc-400">What are you trying to improve?</p>
      </div>
      
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
          Your Current Focus
        </label>
        <Textarea
          value={workingOn}
          onChange={(e) => setWorkingOn(e.target.value)}
          placeholder="e.g., Improving my 3-bet ranges and post-flop aggression"
          className="bg-zinc-700 border-poker-gold/40 text-white resize-none"
          maxLength={200}
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">First Achievement</h3>
        <p className="text-sm text-zinc-400">Add your first poker achievement (optional)</p>
      </div>
      
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
          Achievement Title
        </label>
        <Input
          value={achievementTitle}
          onChange={(e) => setAchievementTitle(e.target.value)}
          placeholder="e.g., WSOP Circuit Winner, 100k hands played"
          className="bg-zinc-700 border-poker-gold/40 text-white"
          maxLength={50}
        />
        <p className="text-xs text-zinc-500 mt-2">
          You can skip this and add achievements later
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-poker-gold/40 shadow-2xl overflow-hidden flex flex-col">
      {/* Gold accent line at top */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-poker-gold to-transparent" />
      
      <div className="p-6 flex flex-col flex-1">
        {renderStepIndicators()}
        
        <div className="flex-1">
          {renderCurrentStep()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-700">
          <div>
            {currentStep > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-zinc-400 hover:text-white"
                disabled={isSaving}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {currentStep < TOTAL_STEPS ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-zinc-500 hover:text-zinc-300"
                  disabled={isSaving}
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-poker-gold text-black hover:bg-poker-darkGold"
                  disabled={isSaving}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-zinc-500 hover:text-zinc-300"
                  disabled={isSaving}
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={handleComplete}
                  className="bg-poker-gold text-black hover:bg-poker-darkGold"
                  disabled={isSaving}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Complete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
