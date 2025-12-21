import React from 'react';
import championshipTrophyImg from '@/assets/championship-trophy.png';
import championshipRingImg from '@/assets/championship-ring.png';
import championshipBraceletImg from '@/assets/championship-bracelet.png';

// Championship Trophy - using actual trophy image (scaled up for clarity)
export const TrophyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden`}>
    <img 
      src={championshipTrophyImg}
      alt="Championship Trophy"
      className="w-full h-full scale-[2.2] object-contain"
    />
  </div>
);

// Championship Ring - using actual ring image (scaled up for clarity)
export const RingIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden`}>
    <img 
      src={championshipRingImg}
      alt="Championship Ring"
      className="w-full h-full scale-[2.2] object-contain"
    />
  </div>
);

// Championship Bracelet - using actual bracelet image (scaled up for clarity)
export const BraceletIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden`}>
    <img 
      src={championshipBraceletImg}
      alt="Championship Bracelet"
      className="w-full h-full scale-[2.2] object-contain"
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
