
import React from 'react';
import { useNavigate } from 'react-router-dom';
import newSessionIcon from '@/assets/start-session-stopwatch.png';

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
    <div className="flex justify-center w-full">
      <button
        onClick={handleClick}
        className="relative w-[28rem] h-[28rem] sm:w-[32rem] sm:h-[32rem] rounded-full overflow-hidden bg-transparent transform transition-transform hover:scale-105 hover:-translate-y-1 focus:outline-none focus-visible:outline-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label="New session"
      >
        <img 
          src={newSessionIcon} 
          alt="Start Session" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      </button>
    </div>
  );
}
