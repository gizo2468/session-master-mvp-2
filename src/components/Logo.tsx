import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/ccb5a20f-df89-4606-ba41-209ac023d7b4.png" 
        alt="Session Master Logo" 
        className="h-16 object-contain"
      />
    </div>
  );
};

export default Logo;