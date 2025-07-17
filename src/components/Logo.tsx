
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/0d997455-edd5-436d-baf8-e2f404db13c1.png" 
        alt="SessionMaster Logo" 
        className="h-8 w-auto object-contain"
      />
    </div>
  );
};

export default Logo;
