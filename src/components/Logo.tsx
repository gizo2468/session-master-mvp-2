import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/740323d2-5296-4efe-8a98-37d61d383629.png" 
        alt="Session Master Logo" 
        className="h-16 object-contain"
      />
    </div>
  );
};

export default Logo;