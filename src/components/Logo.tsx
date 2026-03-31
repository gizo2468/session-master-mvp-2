import React from 'react';
import logoSrc from '@/assets/session-master-logo.png';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <img 
        src={logoSrc} 
        alt="Session Master Logo" 
        className="w-56 h-auto max-h-16 object-contain dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
      />
    </div>
  );
};

export default Logo;
