
import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewSessionButton from '@/components/NewSessionButton';
import StatsQuickView from '@/components/StatsQuickView';
import FocusModeButton from '@/components/FocusModeButton';
import { useSessionContext } from '@/context/SessionContext';
import SessionCard from '@/components/SessionCard';

const Index = () => {
  const navigate = useNavigate();
  const { sessions, activeSession } = useSessionContext();
  
  // Sort sessions by start time (newest first)
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 3);
    
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl text-poker-black font-bold font-serif text-center mb-1">Poker Tracker</h1>
          <p className="text-center text-gray-500 text-sm">Track your poker sessions</p>
        </header>
        
        <div className="flex justify-center mb-10">
          <NewSessionButton />
        </div>
        
        <StatsQuickView />
        
        <div className="mb-4 flex justify-between items-center">
          <h2 className="font-serif text-xl font-bold">Recent Sessions</h2>
          <button 
            className="text-sm text-poker-feltGreen"
            onClick={() => navigate('/history')}
          >
            View All
          </button>
        </div>
        
        {recentSessions.length > 0 ? (
          recentSessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
            No sessions yet. Start tracking your first poker session!
          </div>
        )}
        
        {activeSession && (
          <button
            onClick={() => navigate(`/session/${activeSession.id}`)}
            className="fixed bottom-6 right-6 bg-poker-red text-white rounded-full px-4 py-2 shadow-lg"
          >
            Active Session
          </button>
        )}
        
        <FocusModeButton />
      </div>
    </div>
  );
};

export default Index;
