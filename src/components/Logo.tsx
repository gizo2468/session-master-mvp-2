
import React from 'react';
import { LogoChip } from './Icons';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <h1 className="text-4xl font-bold font-serif tracking-wide flex items-center select-none">
        <span className="text-poker-cream">Sessi</span>
        <span className="relative inline-flex mx-[-3px]">
          <LogoChip className="w-8 h-8 transform translate-y-[1px]" />
        </span>
        <span className="text-poker-cream">n</span>
        <span className="text-poker-feltGreen">Master</span>
      </h1>
    </div>
  );
};

export default Logo;
