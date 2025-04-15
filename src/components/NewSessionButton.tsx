
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

export default function NewSessionButton() {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate('/new-session')}
      className="relative flex flex-col items-center justify-center w-40 h-40 rounded-full bg-poker-gold shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1 active:translate-y-0"
    >
      <div className="absolute inset-0 rounded-full border-4 border-poker-darkGold"></div>
      <Clock className="w-12 h-12 text-white mb-2" />
      <span className="font-serif text-white text-lg font-bold tracking-wide">NEW SESSION</span>
    </button>
  );
}
