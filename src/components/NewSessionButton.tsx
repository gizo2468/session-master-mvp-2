
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
        className="relative transform transition-all hover:scale-105 hover:-translate-y-1 active:scale-95 active:translate-y-0 focus:outline-none focus-visible:outline-none"
        aria-label="New session"
      >
        <img 
          src={newSessionIcon} 
          alt="Start Session" 
          className="w-[28rem] sm:w-[32rem] h-auto object-contain"
          draggable={false}
        />
      </button>
    </div>
  );
}
