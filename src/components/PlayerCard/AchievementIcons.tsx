import React from 'react';
import championshipRingImg from '@/assets/championship-ring.png';
import championshipBraceletImg from '@/assets/championship-bracelet.png';

// Championship Trophy - ornate cup with handles and base
export const TrophyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    {/* Left handle */}
    <path d="M6 5H4c-.55 0-1 .45-1 1v2c0 1.66 1.34 3 3 3" />
    {/* Right handle */}
    <path d="M18 5h2c.55 0 1 .45 1 1v2c0 1.66-1.34 3-3 3" />
    {/* Cup body */}
    <path d="M6 4h12v7c0 3.31-2.69 6-6 6s-6-2.69-6-6V4z" />
    {/* Stem */}
    <path d="M12 17v3" />
    {/* Base */}
    <path d="M8 22h8" />
    <path d="M9 20h6" />
  </svg>
);

// Championship Ring - using actual ring image (scaled up for clarity)
export const RingIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden`}>
    <img 
      src={championshipRingImg}
      alt="Championship Ring"
      className="w-full h-full scale-[1.8] object-contain"
    />
  </div>
);

// Championship Bracelet - using actual bracelet image (scaled up for clarity)
export const BraceletIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden`}>
    <img 
      src={championshipBraceletImg}
      alt="Championship Bracelet"
      className="w-full h-full scale-[1.8] object-contain"
    />
  </div>
);

export const ACHIEVEMENT_ICONS = [
  { id: 'trophy', Icon: TrophyIcon, label: 'Trophy' },
  { id: 'ring', Icon: RingIcon, label: 'Ring' },
  { id: 'bracelet', Icon: BraceletIcon, label: 'Bracelet' }
] as const;

export type AchievementIconId = typeof ACHIEVEMENT_ICONS[number]['id'];

export function getAchievementIcon(iconId: string | undefined): React.FC<{ className?: string }> {
  const found = ACHIEVEMENT_ICONS.find(i => i.id === iconId);
  return found?.Icon || TrophyIcon;
}
