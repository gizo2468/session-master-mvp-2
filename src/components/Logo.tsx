
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/3f9662c7-d3f8-49a2-9735-b097e78328e2.png" 
        alt="Session Master" 
        className="h-20 w-auto select-none"
      />
    </div>
  );
};

export default Logo;
