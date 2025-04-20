import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewSessionButton from '@/components/NewSessionButton';
import StatsQuickView from '@/components/StatsQuickView';
import FocusModeButton from '@/components/FocusModeButton';
import { useSessionContext } from '@/context/SessionContext';
import SessionCard from '@/components/SessionCard';
import Logo from '@/components/Logo';
import DonationCard from '@/components/DonationCard';

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
          <Logo className="mb-2" />
        </header>
        
        <div className="flex justify-center mb-10">
          <NewSessionButton />
        </div>
        
        <StatsQuickView />
        
        <div className="mb-4 flex justify-between items-center">
          <h2 className="font-extrabold text-xl tracking-tight">Recent Sessions</h2>
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
        
        {/* Donation Card - Added at the bottom of the page */}
        <div className="mt-10 mb-16">
          <DonationCard />
        </div>
        
        <FocusModeButton />
      </div>
    </div>
  );
};

export default Index;
