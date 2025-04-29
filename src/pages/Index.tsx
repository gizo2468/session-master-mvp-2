
import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewSessionButton from '@/components/NewSessionButton';
import StatsQuickView from '@/components/StatsQuickView';
import FocusModeButton from '@/components/FocusModeButton';
import { useSessionContext } from '@/context/SessionContext';
import { useLanguage } from '@/context/LanguageContext';
import SessionCard from '@/components/SessionCard';
import Logo from '@/components/Logo';
import DonationCard from '@/components/DonationCard';
import CoachingNav from '@/components/coaching/CoachingNav';
import ConnectionNotification from '@/components/coaching/ConnectionNotification';
import Icon from '@/components/ui/Lucide';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const { sessions, activeSession } = useSessionContext();
  const { t } = useLanguage();
  
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
            aria-label={t('settings')}
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
            {t('recent_sessions')} ({t('active')} {activeSessionsCount})
          </h2>
          <button 
            className="text-sm text-poker-feltGreen"
            onClick={() => navigate('/history')}
          >
            {t('view_all')}
          </button>
        </div>
        
        {recentSessions.length > 0 ? (
          recentSessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
            {t('no_sessions_yet')}
          </div>
        )}
        
        {/* Coaching Navigation */}
        <CoachingNav />
        <ConnectionNotification />
        
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
