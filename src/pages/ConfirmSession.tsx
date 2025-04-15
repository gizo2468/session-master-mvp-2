
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { CheckCircle2 } from 'lucide-react';

export default function ConfirmSession() {
  const navigate = useNavigate();
  const { activeSession } = useSessionContext();
  
  // Redirect if no active session
  React.useEffect(() => {
    if (!activeSession) {
      navigate('/');
    }
  }, [activeSession, navigate]);
  
  if (!activeSession) return null;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold font-serif mb-2">Session Started!</h1>
        <p className="text-gray-600 mb-6">
          Your poker session at {activeSession.location} has been started successfully.
        </p>
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Game:</span>
            <span className="font-medium">{activeSession.gameType}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Format:</span>
            <span className="font-medium">{activeSession.format}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Buy-in:</span>
            <span className="font-medium">${activeSession.buyIn.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-500">Blinds:</span>
            <span className="font-medium">${activeSession.smallBlind}/${activeSession.bigBlind}</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/session/${activeSession.id}`)}
            className="flex-1 py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md shadow transition-all"
          >
            View Session
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 px-4 bg-white hover:bg-gray-50 text-poker-black border border-gray-300 font-bold rounded-md shadow transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
