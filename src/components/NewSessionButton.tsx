
import React from 'react';
import { useNavigate } from 'react-router-dom';
import newSessionIcon from '@/assets/start-session-stopwatch.webp';

export default function NewSessionButton() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    try {
      navigate('/new-session');
    } catch (error) {
      console.error('Error navigating to new session:', error);
      // Fallback: use window.location as backup
      window.location.href = '/new-session';
    }
  };
  
  return (
    <div className="relative flex justify-center w-full">
      {/* Visual layer - not clickable */}
      <div className="pointer-events-none">
        <img 
          src={newSessionIcon} 
          alt="Start Session" 
          className="w-[28rem] sm:w-[32rem] h-auto object-contain"
          draggable={false}
        />
      </div>
      {/* Hit area - circular, sized to match the visible chip only */}
      <button
        data-tour="start-session"
        onClick={handleClick}
        className="tour-pulse-target absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] aspect-square rounded-full bg-transparent cursor-pointer transition-transform hover:scale-105 focus:outline-none focus-visible:outline-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label="New session"
      />
    </div>
  );
}
