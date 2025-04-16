
import React from 'react';
import { LogoChip } from './Icons';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className || ''}`}>
      <h1 className="font-extrabold font-serif tracking-wide flex flex-col items-center select-none">
        <div className="flex items-center">
          <span className="text-5xl text-[#D4AF37] font-black [text-shadow:1px_1px_1px_black]">Sessi</span>
          <span className="relative inline-flex mx-[-3px]">
            <LogoChip className="w-10 h-10 transform translate-y-[1px] [filter:drop-shadow(1px_1px_1px_black)]" />
          </span>
          <span className="text-5xl text-[#D4AF37] font-black [text-shadow:1px_1px_1px_black]">n</span>
        </div>
        <span className="text-5xl text-poker-feltGreen font-black [text-shadow:1px_1px_1px_black]">Master</span>
      </h1>
    </div>
  );
};

export default Logo;
