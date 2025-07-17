
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <img 
        src="/lovable-uploads/43177e6a-1334-498d-9fb6-b0b33bf8abef.png" 
        alt="Session Master" 
        className="h-20 w-auto select-none"
      />
    </div>
  );
};

export default Logo;
