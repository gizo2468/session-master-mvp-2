
import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewSessionButton from '@/components/NewSessionButton';
import StatsQuickView from '@/components/StatsQuickView';
import FocusModeButton from '@/components/FocusModeButton';
import { useSessionContext } from '@/context/SessionContext';
import SessionCard from '@/components/SessionCard';
import Logo from '@/components/Logo';
import CoachingNav from '@/components/coaching/CoachingNav';
import ConnectionNotification from '@/components/coaching/ConnectionNotification';
import Icon from '@/components/ui/Lucide';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const { sessions, activeSession } = useSessionContext();
  
  const activeSessionsCount = activeSession ? 1 : 0;
  
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 3);
    
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8 relative">
          {/* Settings button positioned absolutely in the top-right */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/settings')}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-poker-feltGreen"
            aria-label="Settings"
          >
            <Icon name="Settings" size={20} />
          </Button>
          
          {/* Logo centered in the container */}
          <Logo className="mb-2 mx-auto" />
        </header>
        
        <div className="flex justify-center mb-10">
          <NewSessionButton />
        </div>
        
        {/* Add tutorial target IDs to key features */}
        <div id="live-timer-feature">
          <StatsQuickView />
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <h2 className="font-extrabold text-xl tracking-tight">
            Recent Sessions (Active {activeSessionsCount})
          </h2>
          <button 
            id="add-table-feature"
            className="text-sm text-poker-feltGreen"
            onClick={() => navigate('/history')}
          >
            View All
          </button>
        </div>
        
        {recentSessions.length > 0 ? (
          recentSessions.map(session => (
            <div key={session.id} id={session.id === sessions[0]?.id ? "end-session-feature" : undefined}>
              <SessionCard key={session.id} session={session} />
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
            No sessions yet. Start tracking your first poker session!
          </div>
        )}
        
        {/* Coaching Navigation */}
        <CoachingNav />
        <ConnectionNotification />
        
        <FocusModeButton />
      </div>
    </div>
  );
};

export default Index;
