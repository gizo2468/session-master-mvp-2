
import React, { useState } from 'react';
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
import { useTutorial } from '@/hooks/useTutorial';
import TutorialDialog from '@/components/tutorial/TutorialDialog';
import AddPastSessionForm from '@/components/poker/AddPastSessionForm';

const Index = () => {
  const navigate = useNavigate();
  const { sessions, activeSession } = useSessionContext();
  const { showTutorial, setShowTutorial, completeTutorial } = useTutorial();
  const [showAddPastSession, setShowAddPastSession] = useState(false);
  
  const activeSessionsCount = activeSession ? 1 : 0;
  
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 3);

  if (showAddPastSession) {
    return <AddPastSessionForm onClose={() => setShowAddPastSession(false)} />;
  }
    
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
        
        <StatsQuickView />
        
        <div className="mb-4 flex justify-between items-center">
          <h2 className="font-extrabold text-xl tracking-tight">
            Recent Sessions (Active {activeSessionsCount})
          </h2>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowAddPastSession(true)}
              variant="poker"
              size="sm"
              className="h-8 px-3 text-sm rounded-md"
            >
              <Icon name="plus" className="h-3 w-3 mr-1" />
              Add Past Session
            </Button>
            <button 
              className="text-sm text-poker-feltGreen"
              onClick={() => navigate('/history')}
            >
              View All
            </button>
          </div>
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
        
        {/* Coaching Navigation */}
        <CoachingNav />
        <ConnectionNotification />
        
        <FocusModeButton />
      </div>

      {/* Tutorial Dialog */}
      <TutorialDialog 
        open={showTutorial} 
        onOpenChange={setShowTutorial} 
        onComplete={completeTutorial} 
      />
    </div>
  );
};

export default Index;
