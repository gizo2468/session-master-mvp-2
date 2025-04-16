
import React from 'react';
import { LogoChip } from './Icons';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex items-center justify-center ${className || ''}`}>
      <h1 className="text-5xl font-extrabold font-serif tracking-wide flex items-center select-none">
        <span className="text-[#D4AF37] font-black">Sessi</span>
        <span className="relative inline-flex mx-[-3px]">
          <LogoChip className="w-10 h-10 transform translate-y-[1px]" />
        </span>
        <span className="text-[#D4AF37] font-black">n</span>
        <span className="text-poker-feltGreen font-black">Master</span>
      </h1>
    </div>
  );
};

export default Logo;
