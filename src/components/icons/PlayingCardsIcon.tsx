import React from 'react';

interface PlayingCardsIconProps {
  size?: number;
  className?: string;
}

const PlayingCardsIcon: React.FC<PlayingCardsIconProps> = ({ size = 16, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Back card (slightly rotated) */}
      <rect x="2" y="4" width="12" height="16" rx="1.5" transform="rotate(-8 8 12)" />
      
      {/* Front card */}
      <rect x="8" y="3" width="12" height="16" rx="1.5" fill="white" stroke="currentColor" />
      
      {/* Spade symbol on front card */}
      <path d="M14 8c-1.5 1.5-2 3-2 4 0 1 0.8 1.8 2 1.8s2-0.8 2-1.8c0-1-0.5-2.5-2-4z" fill="currentColor" />
      <path d="M14 13.5v2" strokeWidth="1" />
      <circle cx="13" cy="15" r="0.8" fill="currentColor" />
      <circle cx="15" cy="15" r="0.8" fill="currentColor" />
    </svg>
  );
};

export default PlayingCardsIcon;
