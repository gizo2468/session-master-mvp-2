import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check, SkipForward, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ACHIEVEMENT_ICONS, getAchievementIcon } from './AchievementIcons';
import { COUNTRIES, CURRENCIES } from '@/utils/countries';
import type { PlayerCardData, PlayerPrivateData, PlayerProfile, Achievement } from '@/hooks/usePlayerCard';

interface ProfileOnboardingFlowProps {
  cardData: PlayerCardData | null;
  privateData: PlayerPrivateData | null;
  profile: PlayerProfile | null;
  onUpdateCard: (updates: Partial<PlayerCardData>) => void;
  onUpdatePrivate: (updates: Partial<{ full_name: string }>) => void;
  onUpdateProfile: (updates: Partial<{ country: string; default_currency: string }>) => void;
  onComplete: () => void;
  isSaving: boolean;
}

type GameFormat = 'cash' | 'tournaments' | 'both';

const TOTAL_STEPS = 3;

const POKER_BACKGROUND_OPTIONS = [
  'High Stakes Player',
  'Mid Stakes Player',
  'Online Player',
  'Semi-Professional Player',
  'Professional Player',
  'GTO Expert',
  'Poker Coach'
];

const COACHING_EXPERIENCE_OPTIONS = [
  { value: '1-5', label: '1–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10+', label: '10+ years' }
];

export function ProfileOnboardingFlow({
  cardData,
  privateData,
  profile,
  onUpdateCard,
  onUpdatePrivate,
  onUpdateProfile,
  onComplete,
  isSaving
}: ProfileOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Local form state
  const [displayName, setDisplayName] = useState(privateData?.full_name || '');
  const [gameFormat, setGameFormat] = useState<GameFormat>(cardData?.primary_format || 'both');
  const [country, setCountry] = useState(profile?.country || '');
  const [currency, setCurrency] = useState(profile?.default_currency || '');
  const [pokerBackground, setPokerBackground] = useState<string[]>(cardData?.poker_background || []);
  const [coachingExperience, setCoachingExperience] = useState<string | null>(cardData?.coaching_experience || null);
  const [achievements, setAchievements] = useState<Achievement[]>(cardData?.achievements || []);
  const [newAchievementTitle, setNewAchievementTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('trophy');

  const isPokerCoachSelected = pokerBackground.includes('Poker Coach');

  // Clear coaching experience when Poker Coach is unselected
  useEffect(() => {
    if (!isPokerCoachSelected && coachingExperience) {
      setCoachingExperience(null);
    }
  }, [isPokerCoachSelected]);

  const formatLabels = {
    cash: 'Cash Games',
    tournaments: 'Tournaments',
    both: 'Cash & MTT'
  };

  const togglePokerBackground = (option: string) => {
    if (pokerBackground.includes(option)) {
      setPokerBackground(pokerBackground.filter(bg => bg !== option));
    } else if (pokerBackground.length < 3) {
      setPokerBackground([...pokerBackground, option]);
    }
  };

  const addAchievement = () => {
    if (!newAchievementTitle.trim()) return;
    const newAchievement: Achievement = {
      id: crypto.randomUUID(),
      title: newAchievementTitle.trim(),
      icon: selectedIcon
    };
    setAchievements([...achievements, newAchievement]);
    setNewAchievementTitle('');
    setSelectedIcon('trophy');
  };

  const removeAchievement = (id: string) => {
    setAchievements(achievements.filter(a => a.id !== id));
  };

  // Check if step 2 can proceed (coaching experience required if Poker Coach selected)
  const canProceedFromStep2 = !isPokerCoachSelected || (isPokerCoachSelected && coachingExperience);

  const saveProfileFields = () => {
    const profileUpdates: Partial<{ country: string; default_currency: string }> = {};
    if (country) profileUpdates.country = country;
    if (currency) profileUpdates.default_currency = currency;
    if (Object.keys(profileUpdates).length > 0) {
      onUpdateProfile(profileUpdates);
    }
  };

  const handleNext = () => {
    // Save data for current step before moving on
    if (currentStep === 1) {
      if (displayName.trim()) {
        onUpdatePrivate({ full_name: displayName.trim() });
      }
      onUpdateCard({ primary_format: gameFormat });
      saveProfileFields();
    } else if (currentStep === 2) {
      onUpdateCard({ 
        poker_background: pokerBackground,
        coaching_experience: isPokerCoachSelected ? coachingExperience : null
      });
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
    // Save all data on complete
    if (displayName.trim()) {
      onUpdatePrivate({ full_name: displayName.trim() });
    }
    onUpdateCard({ 
      primary_format: gameFormat,
      poker_background: pokerBackground,
      coaching_experience: isPokerCoachSelected ? coachingExperience : null,
      achievements: achievements
    });
    saveProfileFields();
    onComplete();
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
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

      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
          Country of Residence
        </label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="bg-zinc-700 border-poker-gold/40 text-white">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-poker-gold/40 max-h-[200px]">
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-white hover:bg-zinc-700">
                <span className="flex items-center gap-2">
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
          Primary Playing Currency
        </label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="bg-zinc-700 border-poker-gold/40 text-white">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-poker-gold/40 max-h-[200px]">
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-white hover:bg-zinc-700">
                <span className="flex items-center gap-2">
                  <span className="font-mono">{c.symbol}</span>
                  <span>{c.code} – {c.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Poker Background</h3>
        <p className="text-sm text-zinc-400">Select up to 3 options</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {POKER_BACKGROUND_OPTIONS.map((option) => {
          const isSelected = pokerBackground.includes(option);
          const isDisabled = !isSelected && pokerBackground.length >= 3;
          
          return (
            <Badge
              key={option}
              variant={isSelected ? 'default' : 'outline'}
              className={`cursor-pointer transition-all py-2 px-3 ${
                isSelected
                  ? 'bg-poker-gold text-black hover:bg-poker-darkGold'
                  : isDisabled
                  ? 'border-zinc-600 text-zinc-600 cursor-not-allowed'
                  : 'border-poker-gold/40 text-zinc-400 hover:border-poker-gold hover:text-white'
              }`}
              onClick={() => !isDisabled && togglePokerBackground(option)}
            >
              {option}
            </Badge>
          );
        })}
      </div>
      
      <p className="text-xs text-zinc-500 text-center">
        {pokerBackground.length}/3 selected
      </p>

      {/* Coaching Experience - only shown when Poker Coach is selected */}
      {isPokerCoachSelected && (
        <div className="pt-4 border-t border-zinc-700">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
            Coaching Experience <span className="text-poker-gold">*</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {COACHING_EXPERIENCE_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant={coachingExperience === option.value ? 'default' : 'outline'}
                className={`cursor-pointer transition-all py-2 px-3 ${
                  coachingExperience === option.value
                    ? 'bg-poker-gold text-black hover:bg-poker-darkGold'
                    : 'border-poker-gold/40 text-zinc-400 hover:border-poker-gold hover:text-white'
                }`}
                onClick={() => setCoachingExperience(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
          {!coachingExperience && (
            <p className="text-xs text-amber-500 mt-2">
              Please select your coaching experience to continue
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Achievements</h3>
        <p className="text-sm text-zinc-400">Add your poker achievements</p>
      </div>
      
      {/* Existing achievements */}
      {achievements.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {achievements.map((ach) => {
            const IconComponent = getAchievementIcon(ach.icon);
            return (
              <Badge 
                key={ach.id}
                className="bg-zinc-700 text-poker-gold border-poker-gold/20 pr-1 flex items-center gap-1.5"
              >
                <IconComponent className="w-3.5 h-3.5" />
                {ach.title}
                <button
                  onClick={() => removeAchievement(ach.id)}
                  className="ml-1 hover:bg-zinc-600 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Add new achievement */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
            Achievement Title
          </label>
          <div className="flex gap-2">
            <Input
              value={newAchievementTitle}
              onChange={(e) => setNewAchievementTitle(e.target.value)}
              placeholder="e.g., WSOP Circuit Winner"
              className="bg-zinc-700 border-poker-gold/40 text-white flex-1"
              maxLength={50}
              onKeyDown={(e) => e.key === 'Enter' && addAchievement()}
            />
            <Button
              size="sm"
              onClick={addAchievement}
              disabled={!newAchievementTitle.trim()}
              className="bg-poker-gold text-black hover:bg-poker-darkGold"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block text-center">
            {ACHIEVEMENT_ICONS.find(icon => icon.id === selectedIcon)?.label || 'Icon'}
          </label>
          <div className="flex gap-3 justify-center">
            {ACHIEVEMENT_ICONS.map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => setSelectedIcon(id)}
                title={label}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  selectedIcon === id
                    ? 'bg-poker-gold/20 ring-2 ring-poker-gold text-poker-gold'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  };

  // Disable Next button on step 2 if coaching experience is required but not selected
  const isNextDisabled = currentStep === 2 && !canProceedFromStep2;

  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-poker-gold/40 shadow-2xl overflow-hidden flex flex-col">
      {/* Gold accent line at top */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-poker-gold to-transparent" />
      
      <div className="p-6 flex flex-col flex-1">
        {renderStepIndicators()}
        
        <div className="flex-1 overflow-y-auto">
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
                  disabled={isSaving || isNextDisabled}
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
