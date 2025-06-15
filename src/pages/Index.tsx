
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSessionContext } from '@/context/SessionContext';
import { useActiveSessionRecovery } from '@/hooks/useActiveSessionRecovery';
import SessionCard from '@/components/SessionCard';
import NewSessionButton from '@/components/NewSessionButton';
import StatsQuickView from '@/components/StatsQuickView';
import StorageWarningAlert from '@/components/StorageWarningAlert';
import DonationCard from '@/components/DonationCard';
import FocusModeButton from '@/components/FocusModeButton';
import ActiveSessionsList from '@/components/ActiveSessionsList';
import Logo from '@/components/Logo';
import Icon from '@/components/ui/Lucide';
import { Button } from '@/components/ui/button';
import FilterBar from '@/components/ui/FilterBar';
import { SessionFilter } from '@/types/poker';

export default function Index() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    sessions, 
    filters, 
    setFilters, 
    showStorageWarning, 
    dismissStorageWarning,
    isLoading 
  } = useSessionContext();
  
  const { 
    activeSessions, 
    isLoading: isRecovering, 
    resumeSession,
    hasActiveSessions 
  } = useActiveSessionRecovery();
  
  const [showDonation, setShowDonation] = useState(false);

  // Show donation card occasionally for non-authenticated users
  useEffect(() => {
    if (!user) {
      const shouldShow = Math.random() < 0.3; // 30% chance
      setShowDonation(shouldShow);
    }
  }, [user]);

  const filteredSessions = sessions.filter(session => {
    if (filters.gameType && filters.gameType !== 'All' && session.gameType !== filters.gameType) {
      return false;
    }
    if (filters.format && filters.format !== 'All' && session.format !== filters.format) {
      return false;
    }
    if (filters.location && !session.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Only show completed sessions (not active ones) in recent sessions
  const recentSessions = filteredSessions
    .filter(session => !session.isActive)
    .slice(0, 5);

  const handleSessionClick = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  if (isLoading || isRecovering) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your poker sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto max-w-md px-4 py-4">
          <div className="flex justify-between items-center">
            <Logo />
            <div className="flex items-center gap-4">
              <FocusModeButton />
              {user ? (
                <Button 
                  onClick={logout}
                  variant="outline" 
                  size="sm"
                  className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
                >
                  <Icon name="LogOut" size={16} className="mr-1" />
                  Sign Out
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/auth/login')}
                  variant="outline" 
                  size="sm"
                  className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
                >
                  <Icon name="LogIn" size={16} className="mr-1" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-6">
        {showStorageWarning && <StorageWarningAlert />}
        
        {showDonation && !user && (
          <DonationCard />
        )}
        
        <div className="flex flex-col items-center gap-6">
          {/* NEW SESSION button appears first, at the top */}
          <div className="flex justify-center">
            <NewSessionButton />
          </div>

          {/* Stats section appears after the button */}
          {user && <StatsQuickView />}
          
          {/* Active Sessions List - appears after stats if there are active sessions */}
          {user && hasActiveSessions && (
            <ActiveSessionsList 
              sessions={activeSessions}
              onResume={resumeSession}
            />
          )}
          
          {user && sessions.length > 0 && (
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-extrabold tracking-tight">Recent Sessions</h2>
                <Button 
                  onClick={() => navigate('/history')}
                  variant="outline" 
                  size="sm"
                  className="text-poker-feltGreen"
                >
                  View All
                </Button>
              </div>
              
              <FilterBar filters={filters} onFiltersChange={setFilters} />
              
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    onClick={() => handleSessionClick(session.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {user && sessions.length === 0 && !hasActiveSessions && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Icon name="PlusCircle" size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500 mb-6">Start your first poker session to begin tracking your performance.</p>
            </div>
          )}
          
          {!user && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Icon name="TrendingUp" size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Track Your Poker Journey</h3>
              <p className="text-gray-500 mb-6">Sign up to start tracking your sessions, analyze your performance, and improve your game.</p>
              <Button 
                onClick={() => navigate('/auth/signup')}
                className="bg-poker-gold hover:bg-poker-darkGold text-white"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
