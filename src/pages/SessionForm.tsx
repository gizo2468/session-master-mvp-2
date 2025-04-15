
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { PokerSession } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';

export default function SessionForm() {
  const navigate = useNavigate();
  const { startSession } = useSessionContext();
  
  const [gameType, setGameType] = useState<'NLH' | 'PLO'>('NLH');
  const [format, setFormat] = useState<'Cash' | 'Tournament'>('Cash');
  const [location, setLocation] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [smallBlind, setSmallBlind] = useState('');
  const [bigBlind, setBigBlind] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location || !buyIn || !smallBlind || !bigBlind) {
      setError('Please fill in all fields');
      return;
    }
    
    const newSession: PokerSession = {
      id: uuidv4(),
      gameType,
      format,
      location,
      buyIn: parseFloat(buyIn),
      smallBlind: parseFloat(smallBlind),
      bigBlind: parseFloat(bigBlind),
      startTime: new Date(),
      isActive: true,
    };
    
    startSession(newSession);
    navigate('/confirm-session');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <button onClick={() => navigate(-1)} className="text-poker-feltGreen mb-4 flex items-center">
            ← Back
          </button>
          <h1 className="text-2xl font-serif font-bold">Start New Session</h1>
        </header>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Game Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGameType('NLH')}
                className={`py-2 px-4 rounded-md border ${
                  gameType === 'NLH' 
                    ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                No Limit Hold'em
              </button>
              
              <button
                type="button"
                onClick={() => setGameType('PLO')}
                className={`py-2 px-4 rounded-md border ${
                  gameType === 'PLO' 
                    ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Pot Limit Omaha
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Format</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormat('Cash')}
                className={`py-2 px-4 rounded-md border ${
                  format === 'Cash' 
                    ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Cash Game
              </button>
              
              <button
                type="button"
                onClick={() => setFormat('Tournament')}
                className={`py-2 px-4 rounded-md border ${
                  format === 'Tournament' 
                    ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Tournament
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter casino or home game name"
              className="w-full p-3 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="buyin">
              Buy-in Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                id="buyin"
                type="number"
                value={buyIn}
                onChange={(e) => setBuyIn(e.target.value)}
                placeholder="0.00"
                className="w-full p-3 pl-8 border border-gray-300 rounded-md"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="smallBlind">
                Small Blind
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  id="smallBlind"
                  type="number"
                  value={smallBlind}
                  onChange={(e) => setSmallBlind(e.target.value)}
                  placeholder="1"
                  className="w-full p-3 pl-8 border border-gray-300 rounded-md"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="bigBlind">
                Big Blind
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  id="bigBlind"
                  type="number"
                  value={bigBlind}
                  onChange={(e) => setBigBlind(e.target.value)}
                  placeholder="2"
                  className="w-full p-3 pl-8 border border-gray-300 rounded-md"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md shadow-md transition-all"
          >
            Start Session
          </button>
        </form>
      </div>
    </div>
  );
}
