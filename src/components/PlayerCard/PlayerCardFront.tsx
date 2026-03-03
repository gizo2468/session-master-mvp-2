import React, { useRef, useState } from 'react';
import { Camera, RotateCcw, Award, Pencil, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileOnboardingFlow } from './ProfileOnboardingFlow';
import { getAchievementIcon } from './AchievementIcons';
import { useNativeImagePicker } from '@/hooks/useNativeImagePicker';
import type { PlayerCardData, PlayerProfile, PlayerPrivateData } from '@/hooks/usePlayerCard';
import { COUNTRIES } from '@/utils/countries';

interface PlayerCardFrontProps {
  cardData: PlayerCardData | null;
  profile: PlayerProfile | null;
  privateData: PlayerPrivateData | null;
  yearsOfExperience: number | null;
  onFlip: () => void;
  onUpdateCard: (updates: Partial<PlayerCardData>) => void;
  onUpdatePrivate: (updates: Partial<{ full_name: string }>) => void;
  onUpdateProfile: (updates: Partial<{ country: string; default_currency: string }>) => void;
  onUploadPhoto: (file: File) => void;
  onUploadPhotoDataUrl?: (dataUrl: string) => void;
  isSaving: boolean;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  isFirstTimeUser: boolean;
}

// Helper to format coaching experience for display
const formatCoachingExperience = (exp: string | null): string => {
  switch (exp) {
    case '1-5': return '1-5y';
    case '5-10': return '5-10y';
    case '10+': return '10+y';
    default: return '';
  }
};

export function PlayerCardFront({
  cardData,
  profile,
  privateData,
  yearsOfExperience,
  onFlip,
  onUpdateCard,
  onUpdatePrivate,
  onUpdateProfile,
  onUploadPhoto,
  onUploadPhotoDataUrl,
  isSaving,
  isEditing,
  onEditingChange,
  isFirstTimeUser
}: PlayerCardFrontProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pickImage, isLoading: isPickingImage, isNative } = useNativeImagePicker();
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  // If first-time user or editing, show onboarding flow
  const showOnboarding = isFirstTimeUser || isEditing;

  const handlePhotoClick = async () => {
    if (isNative) {
      // Use native picker on mobile
      const result = await pickImage('prompt');
      if (result && onUploadPhotoDataUrl) {
        onUploadPhotoDataUrl(result.dataUrl);
      }
    } else {
      // Fallback to file input on web
      fileInputRef.current?.click();
    }
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
        profile={profile}
        onUpdateCard={onUpdateCard}
        onUpdatePrivate={onUpdatePrivate}
        onUpdateProfile={onUpdateProfile}
        onComplete={handleOnboardingComplete}
        isSaving={isSaving}
      />
    );
  }

  // Format poker background items for display (add coaching experience to Poker Coach)
  const formatPokerBackgroundItem = (bg: string): string => {
    if (bg === 'Poker Coach' && cardData?.coaching_experience) {
      return `Poker Coach (${formatCoachingExperience(cardData.coaching_experience)})`;
    }
    return bg;
  };

  // View Mode - Static display
  return (
    <>
    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-poker-gold/40 shadow-2xl overflow-hidden flex flex-col">
      {/* Gold accent line at top */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-poker-gold to-transparent" />
      
      <div className="p-6 flex flex-col flex-1">
        {/* Header with photo */}
        <div className="flex items-start gap-4 mb-6">
          {/* Photo - still clickable to upload */}
          <div 
            className="relative w-20 h-20 rounded-full border-2 border-poker-gold/60 overflow-hidden cursor-pointer group flex-shrink-0"
            onClick={() => {
              if (privateData?.profile_picture) {
                setIsImageFullscreen(true);
              }
            }}
          >
            {isPickingImage ? (
              <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-poker-gold animate-spin" />
              </div>
            ) : privateData?.profile_picture ? (
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
            {!isPickingImage && !privateData?.profile_picture && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
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
            {(profile?.country || profile?.default_currency) && (
              <p className="text-xs text-zinc-400 mt-1">
                {profile?.country && (
                  <span>
                    {COUNTRIES.find(c => c.code === profile.country)?.flag}{' '}
                    {COUNTRIES.find(c => c.code === profile.country)?.name}
                  </span>
                )}
                {profile?.country && profile?.default_currency && (
                  <span className="mx-1.5">·</span>
                )}
                {profile?.default_currency && (
                  <span>{profile.default_currency}</span>
                )}
              </p>
            )}
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

        {/* Poker Background - static display */}
        {cardData?.poker_background && cardData.poker_background.length > 0 && (
          <div className="mb-4">
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              Poker Background
            </label>
            <div className="flex flex-wrap gap-2">
              {cardData.poker_background.map((bg) => (
                <Badge 
                  key={bg}
                  variant="outline"
                  className="border-poker-gold/40 text-zinc-300"
                >
                  {formatPokerBackgroundItem(bg)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Achievements - static display only */}
        <div className="flex-1 min-h-0">
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
            <Award className="w-3 h-3" />
            Achievements
          </label>
          <div className="flex flex-wrap gap-2">
            {cardData?.achievements && cardData.achievements.length > 0 ? (
              cardData.achievements.map((ach) => {
                const IconComponent = getAchievementIcon(ach.icon);
                return (
                  <Badge 
                    key={ach.id}
                    className="bg-zinc-700 text-poker-gold border-poker-gold/20 flex items-center gap-1.5"
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    {ach.title}
                  </Badge>
                );
              })
            ) : (
              <p className="text-zinc-500 text-sm italic">No achievements yet</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditingChange(true)}
            className="bg-transparent border border-poker-gold/40 text-poker-gold hover:bg-poker-gold/10 hover:text-poker-gold"
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
    </div>

    {/* Fullscreen avatar lightbox */}
    <Dialog open={isImageFullscreen} onOpenChange={setIsImageFullscreen}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] bg-black/95 border-none p-0 overflow-hidden backdrop-blur-sm flex items-center justify-center [&>button]:hidden">
        <DialogTitle className="sr-only">Profile Photo</DialogTitle>
        <button
          onClick={() => setIsImageFullscreen(false)}
          className="absolute top-3 right-3 z-50 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <button
          onClick={async () => {
            await handlePhotoClick();
            setIsImageFullscreen(false);
          }}
          className="absolute top-3 right-14 z-50 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
        >
          <Pencil className="w-5 h-5" />
        </button>
        {privateData?.profile_picture && (
          <img
            src={privateData.profile_picture}
            alt="Profile"
            className="max-w-[90vw] max-h-[85vh] object-contain animate-scale-in rounded-lg"
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
