import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/7a056524-b301-4508-964b-377bc92032c3.png" 
        alt="Session Master Logo" 
        className="h-16 object-contain"
      />
    </div>
  );
};

export default Logo;