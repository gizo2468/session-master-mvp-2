
import React, { useEffect, useState, useRef } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSessionContext } from '@/context/SessionContext';
import { useActiveSessionRecovery } from '@/hooks/useActiveSessionRecovery';
import { useUnifiedSessionStats } from '@/hooks/useUnifiedSessionStats';
import SessionCard from '@/components/SessionCard';
import NewSessionButton from '@/components/NewSessionButton';
import StatsQuickView from '@/components/StatsQuickView';
import StorageWarningAlert from '@/components/StorageWarningAlert';

import ActiveSessionsList from '@/components/ActiveSessionsList';
import Logo from '@/components/Logo';
import Icon from '@/components/ui/Lucide';
import { Button } from '@/components/ui/button';
import FilterBar from '@/components/ui/FilterBar';
import { SessionFilter } from '@/types/poker';
import NotificationBell from '@/components/NotificationBell';
import { PlayerCardModal } from '@/components/PlayerCard/PlayerCardModal';
import chipPlayerCard from '@/assets/chip-player-card.png';
import chipMyNotes from '@/assets/chip-my-notes.png';
import chipCoach from '@/assets/chip-coach.png';
import ViewAllNotesModal from '@/components/notes/ViewAllNotesModal';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Index() {
  // Always start at the true top when mounting or returning to Home
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    sessions, 
    filters, 
    setFilters, 
    showStorageWarning, 
    dismissStorageWarning,
    isLoading,
    refreshSessionsFromDatabase 
  } = useSessionContext();
  
  const { 
    activeSessions, 
    isLoading: isRecovering, 
    resumeSession,
    hasActiveSessions 
  } = useActiveSessionRecovery();
  
  const { isLoading: statsLoading } = useUnifiedSessionStats();
  
  const [playerCardOpen, setPlayerCardOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const { connectedCoaches, isCoach, students } = useCoachStudent();
  const [showPlayersModal, setShowPlayersModal] = useState(false);

  // Splash screen logic
  const allDataReady = !isLoading && !isRecovering && !statsLoading;
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashRemoved, setSplashRemoved] = useState(false);

  // Onboarding tour — multi-step spotlight, shown to first-time users or after reset
  const { shouldShow: showOnboardingTour, dismiss: dismissOnboardingTour } = useOnboardingTour();

  const tourSteps = React.useMemo(
    () => [
      {
        selector: '[data-tour="logo"]',
        title: 'Welcome to Session Master',
        body: "We're glad to have you here! Before you jump into the action, let's take a quick 30-second tour to show you where everything is and how to track your first winning session.",
      },
      {
        selector: '[data-tour="start-session"]',
        title: 'Start a Session',
        body: 'Click the chip to start your first session and see the app in action!',
      },
      {
        selector: '[data-tour="stats"]',
        title: 'Your Session Stats',
        body: 'Track your sessions, record, and win rate at a glance.',
      },
      {
        selector: '[data-tour="nav"]',
        title: 'Settings & Profile',
        body: 'Open Settings or your Profile any time from here.',
      },
    ],
    []
  );

  useEffect(() => {
    if (allDataReady && splashVisible) {
      // Start fade-out
      setSplashVisible(false);
      // Remove from DOM after transition
      const timer = setTimeout(() => setSplashRemoved(true), 400);
      return () => clearTimeout(timer);
    }
  }, [allDataReady]);

  const handleCoachChipClick = () => {
    if (isCoach) {
      setShowPlayersModal(true);
    } else if (connectedCoaches.length > 0) {
      navigate(`/coach/${connectedCoaches[0].id}`);
    } else {
      navigate('/dashboard?openConnect=true');
    }
  };


  // Removed duplicate refresh - SessionContext already loads data on initialization
  // The refresh will happen automatically via the context's useEffect
  

  // Memoize filtered sessions
  const filteredSessions = React.useMemo(() => {
    return sessions.filter(session => {
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
  }, [sessions, filters]);

  // Only show completed sessions (not active ones) in recent sessions
  const recentSessions = React.useMemo(() => {
    return filteredSessions
      .filter(session => !session.isActive)
      .slice(0, 10);
  }, [filteredSessions]);
  
  // Check if we should show a second "View All" button
  const totalCompletedSessions = filteredSessions.filter(session => !session.isActive).length;
  const shouldShowSecondViewAll = totalCompletedSessions >= 10;

  const handleSessionClick = (sessionId: string) => {
    // Find the session to check its status
    const session = sessions.find(s => s.id === sessionId);
    
    if (session?.isActive) {
      // Active session -> route to LiveSession
      navigate(`/session/${sessionId}`);
    } else {
      // Completed session -> route to SessionDetail
      navigate(`/session/${sessionId}/details`);
    }
  };

  const sessionsLoading = isLoading || isRecovering;

  return (
    <>
      {/* Splash screen overlay */}
      {!splashRemoved && (
        <div
          className={`fixed inset-0 z-50 bg-background flex items-center justify-center transition-opacity duration-300 ${
            splashVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Logo />
            </div>
            <div className="flex justify-center">
              <Icon name="Loader2" size={32} className="animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">Loading Session Master...</p>
          </div>
        </div>
      )}
    <div className="min-h-screen">
      <header className="bg-white dark:bg-card shadow-sm dark:shadow-black/20 relative z-10 header-safe py-0">
        <div className="container mx-auto max-w-md px-4 py-0">
          <div className="flex justify-between items-center">
            <div data-tour="nav" className="flex-1 flex justify-start gap-2">
              <Button 
                onClick={() => navigate('/settings')}
                variant="outline" 
                size="sm"
                className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white dark:border-poker-gold dark:text-poker-gold dark:hover:bg-poker-gold"
              >
                <Icon name="Settings" size={16} />
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline" 
                size="sm"
                className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white dark:border-poker-gold dark:text-poker-gold dark:hover:bg-poker-gold"
              >
                <Icon name="User" size={16} />
              </Button>
            </div>
            <div data-tour="logo" className="flex-1 flex justify-center">
              <Logo />
            </div>
            <div className="flex-1 flex justify-end gap-2">
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-0">
        {showStorageWarning && <StorageWarningAlert />}
        
        
        <div className="flex flex-col items-center gap-0">
          {/* START SESSION chip + three icon buttons in one relative container */}
          <div className="relative flex justify-center -mt-36 mb-0">
            {/* Premium gold glow — dark mode only */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-[85%] h-[75%] rounded-full hidden dark:block bg-[radial-gradient(ellipse_at_center,rgba(218,165,32,0.18)_0%,rgba(218,165,32,0.08)_40%,transparent_70%)] blur-2xl pointer-events-none" />
            <NewSessionButton />

            {/* Left icon – Player Card */}
            <button
              onClick={() => setPlayerCardOpen(true)}
              className="absolute bottom-[24%] left-[5%] z-10 rounded-full overflow-hidden bg-transparent transform transition-transform hover:scale-105 focus:outline-none focus-visible:outline-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Player Card"
            >
              <img src={chipPlayerCard} alt="Player Card" className="w-28 h-auto object-contain" draggable={false} />
            </button>

            {/* Middle icon – Coach */}
            <button
              onClick={handleCoachChipClick}
              className="absolute bottom-[14%] left-1/2 -translate-x-1/2 z-10 rounded-full overflow-hidden bg-transparent transform transition-transform hover:scale-105 focus:outline-none focus-visible:outline-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Coach Network"
            >
              <img src={chipCoach} alt="Coach Network" className="w-28 h-auto object-contain" draggable={false} />
            </button>

            {/* Right icon – My Notes */}
            <button
              onClick={() => setNotesModalOpen(true)}
              className="absolute bottom-[24%] right-[5%] z-10 rounded-full overflow-hidden bg-transparent transform transition-transform hover:scale-105 focus:outline-none focus-visible:outline-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="My Notes"
            >
              <img src={chipMyNotes} alt="My Notes" className="w-28 h-auto object-contain" draggable={false} />
            </button>
          </div>

          {/* Stats section appears after the button */}
          <div data-tour="stats" className="w-full -mt-28">
            <StatsQuickView />
          </div>
          
          {/* Active Sessions List - appears after stats if there are active sessions */}
          {!sessionsLoading && hasActiveSessions && (
            <ActiveSessionsList 
              sessions={activeSessions}
              onResume={resumeSession}
            />
          )}
          
          {/* Recent Sessions header - always visible */}
          <div className="w-full space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold tracking-tight">Recent Sessions</h2>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => navigate('/add-past-session')}
                  variant="outline" 
                  size="sm"
                  className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white dark:border-poker-gold dark:text-poker-gold dark:hover:bg-poker-gold"
                >
                  <Icon name="Plus" size={16} />
                </Button>
                <Button 
                  onClick={() => navigate('/history')}
                  variant="outline" 
                  size="sm"
                  className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white dark:border-poker-gold dark:text-poker-gold dark:hover:bg-poker-gold"
                >
                  View All
                </Button>
              </div>
            </div>
            
            {/* Show filters and sessions only if there are sessions */}
            {sessionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-card rounded-lg shadow-md dark:shadow-black/30 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-2">
                        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </div>
                      <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-4 w-20 mx-auto animate-pulse rounded bg-muted mb-3" />
                    <div className="h-12 w-full animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : sessions.length > 0 ? (
              <>
                <FilterBar filters={filters} onFiltersChange={setFilters} />
                
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      onClick={() => handleSessionClick(session.id)}
                    />
                  ))}
                  
                  {/* Second "View All" button when showing 10+ sessions */}
                  {shouldShowSecondViewAll && (
                    <div className="flex justify-center pt-4">
                      <Button 
                        onClick={() => navigate('/history')}
                        variant="outline" 
                        size="sm"
                        className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white dark:border-poker-gold dark:text-poker-gold dark:hover:bg-poker-gold"
                      >
                        View All
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : !hasActiveSessions && !sessionsLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Icon name="PlusCircle" size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">No sessions yet</h3>
                <p className="text-gray-500 dark:text-muted-foreground mb-6">Start your first poker session to begin tracking your performance.</p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      <div className="pb-6" />
      
      <PlayerCardModal open={playerCardOpen} onOpenChange={setPlayerCardOpen} />
      <ViewAllNotesModal open={notesModalOpen} onOpenChange={setNotesModalOpen} />

      {/* Multi-step onboarding spotlight tour */}
      {splashRemoved && showOnboardingTour && (
        <OnboardingTour steps={tourSteps} onClose={dismissOnboardingTour} />
      )}

      {/* Coach: Connected Players Modal */}
      <Dialog open={showPlayersModal} onOpenChange={setShowPlayersModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Connected Players</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No connected players yet.</p>
            ) : (
              students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    setShowPlayersModal(false);
                    navigate(`/player/${student.id}`);
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{student.displayName?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{student.displayName || 'Unknown'}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
