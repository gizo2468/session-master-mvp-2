import React from 'react';
import championshipTrophyImg from '@/assets/championship-trophy.png';
import championshipRingImg from '@/assets/championship-ring.png';

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

// Championship Bracelet - gold SVG bangle bracelet that fits well in square container
export const BraceletIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    className={className}
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer ring with gold gradient */}
    <ellipse 
      cx="12" 
      cy="12" 
      rx="10" 
      ry="10" 
      stroke="url(#braceletGold)" 
      strokeWidth="3"
      fill="none"
    />
    {/* Inner decorative ring */}
    <ellipse 
      cx="12" 
      cy="12" 
      rx="7" 
      ry="7" 
      stroke="url(#braceletGoldDark)" 
      strokeWidth="1.5"
      fill="none"
    />
    {/* Center gem/diamond accent */}
    <circle cx="12" cy="4" r="2" fill="url(#braceletGold)" />
    <circle cx="12" cy="4" r="1" fill="#FFF8DC" opacity="0.8" />
    {/* Side accents */}
    <circle cx="4" cy="12" r="1.5" fill="url(#braceletGold)" />
    <circle cx="20" cy="12" r="1.5" fill="url(#braceletGold)" />
    <circle cx="12" cy="20" r="1.5" fill="url(#braceletGold)" />
    {/* Gold gradients */}
    <defs>
      <linearGradient id="braceletGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5D76E" />
        <stop offset="50%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
      <linearGradient id="braceletGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#996515" />
      </linearGradient>
    </defs>
  </svg>
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
