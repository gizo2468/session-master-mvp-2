import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/2101ccb7-bfc0-4bef-8b16-7ddd2a48c88d.png" 
        alt="Session Master Logo" 
        className="h-16 object-contain"
      />
    </div>
  );
};

export default Logo;