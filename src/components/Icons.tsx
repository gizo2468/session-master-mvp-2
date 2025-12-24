
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  // Additional props can be added here if needed
}

export const Focus = (props: IconProps) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="8" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="2" y1="12" x2="4" y2="12" />
  </svg>
);

export const PokerChip = (props: IconProps) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill="#B71C1C" />
    <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" />
    
    <path d="M12 4l1.5 2.5h-3L12 4z" fill="white" transform="rotate(0 12 12)"/>
    <path d="M12 4l1.5 2.5h-3L12 4z" fill="white" transform="rotate(90 12 12)"/>
    <path d="M12 4l1.5 2.5h-3L12 4z" fill="white" transform="rotate(180 12 12)"/>
    <path d="M12 4l1.5 2.5h-3L12 4z" fill="white" transform="rotate(270 12 12)"/>
    
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" strokeDasharray="20 20" fill="none" />
  </svg>
);

export const LogoChip = (props: IconProps) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill="#B71C1C" stroke="black" strokeWidth="0.5" />
    <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" />
    
    <path d="M12 4l1.5 2.5h-3L12 4z" fill="white" stroke="black" strokeWidth="0.3" transform="rotate(0 12 12)"/>
    <path d="M12 4l1.5 2.5h-3L12 4z" fill="white" stroke="black" strokeWidth="0.3" transform="rotate(90 12 12)"/>
    <path d="M12 4l1.5 2.5h-3L12 4z" fill="white" stroke="black" strokeWidth="0.3" transform="rotate(180 12 12)"/>
    <path d="M12 4l1.5 2.5h-3L12 4z" fill="white" stroke="black" strokeWidth="0.3" transform="rotate(270 12 12)"/>
    
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" strokeDasharray="20 20" fill="none" />
  </svg>
);
