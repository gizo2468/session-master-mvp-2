import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <img 
      src="/lovable-uploads/ccb5a20f-df89-4606-ba41-209ac023d7b4.png" 
      alt="Session Master Logo" 
      className={`h-32 object-contain ${className || ''}`}
    />
  );
};

export default Logo;