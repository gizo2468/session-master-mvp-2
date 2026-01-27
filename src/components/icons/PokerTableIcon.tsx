import React from 'react';

interface PokerTableIconProps {
  size?: number;
  className?: string;
}

const PokerTableIcon: React.FC<PokerTableIconProps> = ({ size = 16, className = '' }) => {
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
      {/* Outer table oval */}
      <ellipse cx="12" cy="12" rx="11" ry="7" />
      
      {/* Inner table rail */}
      <ellipse cx="12" cy="12" rx="8" ry="4.5" />
      
      {/* Card slots on the table */}
      <rect x="5" y="10" width="3" height="4" rx="0.5" />
      <rect x="9" y="10" width="3" height="4" rx="0.5" />
      <rect x="13" y="10" width="3" height="4" rx="0.5" />
      <rect x="17" y="10" width="3" height="4" rx="0.5" />
      
      {/* Small dots for player positions */}
      <circle cx="3" cy="12" r="0.8" fill="currentColor" />
      <circle cx="21" cy="12" r="0.8" fill="currentColor" />
      <circle cx="6" cy="7" r="0.8" fill="currentColor" />
      <circle cx="18" cy="7" r="0.8" fill="currentColor" />
      <circle cx="6" cy="17" r="0.8" fill="currentColor" />
      <circle cx="18" cy="17" r="0.8" fill="currentColor" />
    </svg>
  );
};

export default PokerTableIcon;
