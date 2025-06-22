
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Lucide';

export default function NewSessionButton() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    try {
      console.log('🎯 Navigating to new session form');
      navigate('/new-session');
    } catch (error) {
      console.error('❌ Error navigating to new session:', error);
      // Fallback: try to reload the page to the new session route
      window.location.href = '/new-session';
    }
  };
  
  return (
    <div className="flex justify-center w-full">
      <button
        onClick={handleClick}
        className="relative flex flex-col items-center justify-center w-40 h-40 rounded-full shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-poker-gold"
        aria-label="New session"
      >
        {/* Stopwatch outer ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#e6c664] via-[#d4af37] to-[#b08b30] shadow-lg"></div>
        
        {/* Stopwatch center */}
        <div className="absolute inset-[6px] rounded-full bg-gradient-to-b from-[#8B0000] to-[#5c0000]"></div>
        
        {/* Stopwatch crown */}
        <div className="absolute -top-4 w-4 h-6 bg-gradient-to-b from-[#e6c664] to-[#b08b30] rounded"></div>
        
        {/* Stopwatch loop */}
        <div className="absolute -top-6 w-6 h-2 bg-gradient-to-b from-[#e6c664] to-[#b08b30] rounded-full"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <Icon name="Clock" className="w-10 h-10 text-white mb-1" />
          <span className="text-white text-base font-bold tracking-wide text-center">
            NEW<br />SESSION
          </span>
        </div>
        
        {/* Tick marks around the edge */}
        <div className="absolute inset-0 rounded-full">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-1 h-2 bg-white/30"
              style={{
                left: '50%',
                top: '6px',
                transform: `rotate(${i * 30}deg) translateX(-50%)`,
                transformOrigin: 'bottom center'
              }}
            ></div>
          ))}
        </div>
      </button>
    </div>
  );
}
