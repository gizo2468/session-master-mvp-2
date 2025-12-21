import React, { useRef, useState } from 'react';
import { Camera, RotateCcw, Award, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileOnboardingFlow } from './ProfileOnboardingFlow';
import { AddAchievementModal } from './AddAchievementModal';
import type { PlayerCardData, PlayerProfile, PlayerPrivateData, Achievement } from '@/hooks/usePlayerCard';

interface PlayerCardFrontProps {
  cardData: PlayerCardData | null;
  profile: PlayerProfile | null;
  privateData: PlayerPrivateData | null;
  yearsOfExperience: number | null;
  onFlip: () => void;
  onUpdateCard: (updates: Partial<PlayerCardData>) => void;
  onUpdatePrivate: (updates: Partial<{ full_name: string }>) => void;
  onUploadPhoto: (file: File) => void;
  isSaving: boolean;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  isFirstTimeUser: boolean;
}

export function PlayerCardFront({
  cardData,
  profile,
  privateData,
  yearsOfExperience,
  onFlip,
  onUpdateCard,
  onUpdatePrivate,
  onUploadPhoto,
  isSaving,
  isEditing,
  onEditingChange,
  isFirstTimeUser
}: PlayerCardFrontProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // If first-time user or editing, show onboarding flow
  const showOnboarding = isFirstTimeUser || isEditing;

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPhoto(file);
    }
  };

  const handleOnboardingComplete = () => {
    onEditingChange(false);
  };

  const handleAddAchievement = (achievement: Achievement) => {
    if (!cardData) return;
    onUpdateCard({ 
      achievements: [...(cardData.achievements || []), achievement] 
    });
  };

  const formatLabels = {
    cash: 'Cash Games',
    tournaments: 'Tournaments',
    both: 'Cash & MTT'
  };

  // Show onboarding flow
  if (showOnboarding) {
    return (
      <ProfileOnboardingFlow
        cardData={cardData}
        privateData={privateData}
        onUpdateCard={onUpdateCard}
        onUpdatePrivate={onUpdatePrivate}
        onComplete={handleOnboardingComplete}
        isSaving={isSaving}
      />
    );
  }

  // View Mode - Static display
  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-poker-gold/40 shadow-2xl overflow-hidden flex flex-col">
      {/* Gold accent line at top */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-poker-gold to-transparent" />
      
      <div className="p-6 flex flex-col flex-1">
        {/* Header with photo */}
        <div className="flex items-start gap-4 mb-6">
          {/* Photo - still clickable to upload */}
          <div 
            className="relative w-20 h-20 rounded-full border-2 border-poker-gold/60 overflow-hidden cursor-pointer group flex-shrink-0"
            onClick={handlePhotoClick}
          >
            {privateData?.profile_picture ? (
              <img 
                src={privateData.profile_picture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                <Camera className="w-8 h-8 text-zinc-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </div>

          {/* Name and username - static display */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              {privateData?.full_name || 'Your Name'}
            </h2>
            <p className="text-poker-gold text-sm">
              @{profile?.username || profile?.online_nickname || 'username'}
            </p>
          </div>
        </div>

        {/* Format badges - static display */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {cardData?.primary_format && (
            <Badge
              className="bg-poker-gold text-black"
            >
              {formatLabels[cardData.primary_format]}
            </Badge>
          )}
          {yearsOfExperience !== null && yearsOfExperience > 0 && (
            <Badge 
              variant="outline" 
              className="border-poker-gold/40 text-poker-gold"
            >
              {yearsOfExperience}+ Years
            </Badge>
          )}
        </div>

        {/* Specialization - static display */}
        <div className="mb-4">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Specialization</label>
          <p className="text-white">
            {cardData?.specialization || 
              <span className="text-zinc-500 italic">Not set</span>}
          </p>
        </div>

        {/* Improvement goals - static display */}
        <div className="mb-4">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Working On</label>
          <p className="text-zinc-300 text-sm">
            {cardData?.improvement_goals || 
              <span className="text-zinc-500 italic">Not set</span>}
          </p>
        </div>

        {/* Achievements - static display with add button */}
        <div className="flex-1 min-h-0">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
            <Award className="w-3 h-3" />
            Achievements
          </label>
          <div className="flex flex-wrap gap-2">
            {cardData?.achievements?.map((ach) => (
              <Badge 
                key={ach.id}
                className="bg-zinc-700 text-poker-gold border-poker-gold/20"
              >
                {ach.icon} {ach.title}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className="border-dashed border-zinc-600 text-zinc-400 cursor-pointer hover:border-poker-gold hover:text-poker-gold transition-colors"
              onClick={() => setShowAchievementModal(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Achievement
            </Badge>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditingChange(true)}
            className="border-poker-gold/40 text-poker-gold hover:bg-poker-gold/10"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFlip}
            className="text-poker-gold hover:text-poker-darkGold hover:bg-poker-gold/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Flip Card
          </Button>
        </div>
      </div>

      {/* Achievement modal */}
      <AddAchievementModal
        open={showAchievementModal}
        onOpenChange={setShowAchievementModal}
        onAdd={handleAddAchievement}
      />
    </div>
  );
}
