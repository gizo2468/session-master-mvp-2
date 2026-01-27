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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer table oval (rail) */}
      <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
      
      {/* Inner table felt */}
      <rect x="4" y="8" width="16" height="8" rx="4" ry="4" />
      
      {/* Vertical divider lines on the rail */}
      <line x1="5" y1="5" x2="5" y2="8" />
      <line x1="9" y1="5" x2="9" y2="8" />
      <line x1="15" y1="5" x2="15" y2="8" />
      <line x1="19" y1="5" x2="19" y2="8" />
      
      <line x1="5" y1="16" x2="5" y2="19" />
      <line x1="9" y1="16" x2="9" y2="19" />
      <line x1="15" y1="16" x2="15" y2="19" />
      <line x1="19" y1="16" x2="19" y2="19" />
    </svg>
  );
};

export default PokerTableIcon;
