import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/9dacd61d-619a-4834-8789-3d9484fc67a0.png" 
        alt="Session Master Logo" 
        className="h-24 w-auto object-contain"
      />
    </div>
  );
};

export default Logo;