import React from 'react';

// Simple monochrome achievement icons matching dark + gold style
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
    <path d="M6 9H4.5C3.67 9 3 8.33 3 7.5V6C3 5.17 3.67 4.5 4.5 4.5H6" />
    <path d="M18 9h1.5c.83 0 1.5-.67 1.5-1.5V6c0-.83-.67-1.5-1.5-1.5H18" />
    <path d="M6 4.5h12v6c0 3.31-2.69 6-6 6s-6-2.69-6-6v-6Z" />
    <path d="M12 16.5v2" />
    <path d="M8 21.5h8" />
    <path d="M9 21.5v-3" />
    <path d="M15 21.5v-3" />
  </svg>
);

export const RingIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <ellipse cx="12" cy="14" rx="8" ry="5" />
    <path d="M12 9V6" />
    <path d="M9 6h6" />
    <circle cx="12" cy="4.5" r="1.5" />
  </svg>
);

export const BraceletIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <ellipse cx="12" cy="12" rx="9" ry="4" />
    <path d="M3 12c0 2.21 4.03 4 9 4s9-1.79 9-4" />
    <path d="M12 8v-4" />
    <path d="M10 4h4" />
    <circle cx="12" cy="3" r="1" />
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
