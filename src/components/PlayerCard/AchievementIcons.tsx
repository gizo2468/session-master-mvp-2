import React from 'react';

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

// Championship Ring - WSOP style with gem setting
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
    {/* Ring band - perspective oval */}
    <ellipse cx="12" cy="15" rx="7" ry="4" />
    {/* Inner band line */}
    <path d="M5 15c0-1.5 3.13-2.5 7-2.5s7 1 7 2.5" />
    {/* Gem setting base */}
    <path d="M8 11l4-6 4 6" />
    {/* Gem facets */}
    <path d="M8 11h8" />
    <path d="M12 5v6" />
  </svg>
);

// Championship Bracelet - WSOP style with center medallion
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
    {/* Bracelet band - curved perspective */}
    <path d="M3 14c0 2.5 4 4.5 9 4.5s9-2 9-4.5" />
    <path d="M3 14c0-2.5 4-4.5 9-4.5s9 2 9 4.5" />
    {/* Center medallion */}
    <circle cx="12" cy="14" r="3" />
    {/* Medallion detail */}
    <circle cx="12" cy="14" r="1.5" />
    {/* Band links left */}
    <path d="M5 12.5v3" />
    <path d="M7 11v6" />
    {/* Band links right */}
    <path d="M19 12.5v3" />
    <path d="M17 11v6" />
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
