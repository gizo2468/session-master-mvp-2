
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/f2b42ae3-8208-4bb8-ad36-4a84f55ab3b1.png" 
        alt="SessionMaster Logo" 
        className="h-8 w-auto object-contain"
      />
    </div>
  );
};

export default Logo;
