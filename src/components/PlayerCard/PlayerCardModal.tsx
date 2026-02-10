import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerCardFront } from './PlayerCardFront';
import { PlayerCardBack } from './PlayerCardBack';
import { usePlayerCard } from '@/hooks/usePlayerCard';

interface PlayerCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerCardModal({ open, onOpenChange }: PlayerCardModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [flipKey, setFlipKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  const {
    isLoading,
    isSaving,
    cardData,
    profile,
    privateData,
    yearsOfExperience,
    barcodeValue,
    activeStudentsCount,
    updateCardData,
    updatePrivateData,
    updateProfile,
    uploadPhoto,
    isFirstTimeUser
  } = usePlayerCard();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setIsFlipped(false);
      setIsClosing(false);
      setFlipKey(0);
      // Only auto-show onboarding for first-time users
      // Otherwise stay in view mode
      setIsEditing(false);
    }
  }, [open]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onOpenChange(false);
      setIsClosing(false);
    }, 300);
  };

  const handleFlip = () => {
    setFlipKey(prev => prev + 1);
    setIsFlipped(prev => !prev);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Card container with 3D perspective */}
      <div 
        className={`w-full max-w-sm ${isClosing ? 'animate-modal-slide-out' : 'animate-modal-slide-in'}`}
        style={{ perspective: '1200px' }}
      >
        {isLoading ? (
          <div className="w-full aspect-[3/4] bg-zinc-800 rounded-2xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-poker-gold border-t-transparent" />
          </div>
        ) : (
          <div 
            className="relative w-full aspect-[3/4]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front side */}
            <div 
              key={`front-${flipKey}`}
              className={`absolute inset-0 ${
                isFlipped ? 'animate-card-flip-front' : flipKey > 0 ? 'animate-card-unflip-front' : ''
              }`}
              style={{ 
                backfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d'
              }}
            >
              <PlayerCardFront
                cardData={cardData}
                profile={profile}
                privateData={privateData}
                yearsOfExperience={yearsOfExperience}
                onFlip={handleFlip}
                onUpdateCard={updateCardData}
                onUpdatePrivate={updatePrivateData}
                onUpdateProfile={updateProfile}
                onUploadPhoto={uploadPhoto}
                isSaving={isSaving}
                isEditing={isEditing}
                onEditingChange={setIsEditing}
                isFirstTimeUser={isFirstTimeUser}
              />
            </div>

            {/* Back side */}
            <div 
              key={`back-${flipKey}`}
              className={`absolute inset-0 ${
                isFlipped ? 'animate-card-flip-back' : flipKey > 0 ? 'animate-card-unflip-back' : ''
              }`}
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              <PlayerCardBack
                barcodeValue={barcodeValue}
                primaryFormat={cardData?.primary_format || 'both'}
                isCoach={profile?.role === 'coach'}
                coachingExperience={cardData?.coaching_experience || null}
                activeStudentsCount={activeStudentsCount}
                achievements={cardData?.achievements || []}
                onFlip={handleFlip}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
