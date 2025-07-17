import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/8090f74c-bebb-42fa-a365-6c0af4dd9444.png" 
        alt="Session Master Logo" 
        className="h-16 object-contain"
      />
    </div>
  );
};

export default Logo;