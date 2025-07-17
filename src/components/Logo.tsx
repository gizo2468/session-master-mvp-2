
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/c681eb13-8726-4fbb-98d6-a948bcaf76ed.png" 
        alt="Session Master" 
        className="h-10 md:h-12 w-auto select-none" 
      />
    </div>
  );
};

export default Logo;
