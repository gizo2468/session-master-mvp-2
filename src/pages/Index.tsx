
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSessionContext } from '@/context/SessionContext';
import { useActiveSessionRecovery } from '@/hooks/useActiveSessionRecovery';
import SessionCard from '@/components/SessionCard';
import NewSessionButton from '@/components/NewSessionButton';
import StatsQuickView from '@/components/StatsQuickView';
import StorageWarningAlert from '@/components/StorageWarningAlert';

import PlayerCardButton from '@/components/PlayerCardButton';
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
import ViewAllNotesModal from '@/components/notes/ViewAllNotesModal';

export default function Index() {
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
  const [playerCardOpen, setPlayerCardOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);


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
            <div className="flex-1 flex justify-start gap-2">
              <Button 
                onClick={() => navigate('/settings')}
                variant="outline" 
                size="sm"
                className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
              >
                <Icon name="Settings" size={16} />
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline" 
                size="sm"
                className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
              >
                <Icon name="User" size={16} />
              </Button>
            </div>
            <div className="flex-1 flex justify-center">
              <Logo />
            </div>
            <div className="flex-1 flex justify-end gap-2">
              <NotificationBell />
              <PlayerCardButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-0">
        {showStorageWarning && <StorageWarningAlert />}
        
        
        <div className="flex flex-col items-center gap-0">
          {/* NEW SESSION button appears first, at the top */}
          <div className="flex justify-center -my-24">
            <NewSessionButton />
          </div>

          {/* Player Card & My Notes chip buttons */}
          <div className="flex justify-between px-6 -mt-24 w-full">
            <button
              onClick={() => setPlayerCardOpen(true)}
              className="transform transition-all hover:scale-105 active:scale-95 focus:outline-none"
              aria-label="Player Card"
            >
              <img src={chipPlayerCard} alt="Player Card" className="w-32 h-auto object-contain" draggable={false} />
            </button>
            <button
              onClick={() => setNotesModalOpen(true)}
              className="transform transition-all hover:scale-105 active:scale-95 focus:outline-none"
              aria-label="My Notes"
            >
              <img src={chipMyNotes} alt="My Notes" className="w-32 h-auto object-contain" draggable={false} />
            </button>
          </div>

          {/* Stats section appears after the button */}
          <div className="-mt-16 w-full">
            <StatsQuickView />
          </div>
          
          {/* Active Sessions List - appears after stats if there are active sessions */}
          {hasActiveSessions && (
            <ActiveSessionsList 
              sessions={activeSessions}
              onResume={resumeSession}
            />
          )}
          
          {/* Recent Sessions header - always visible */}
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold tracking-tight">Recent Sessions</h2>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => navigate('/add-past-session')}
                  variant="outline" 
                  size="sm"
                  className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
                >
                  <Icon name="Plus" size={16} />
                </Button>
                <Button 
                  onClick={() => navigate('/history')}
                  variant="outline" 
                  size="sm"
                  className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
                >
                  View All
                </Button>
              </div>
            </div>
            
            {/* Show filters and sessions only if there are sessions */}
            {sessions.length > 0 ? (
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
                        className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
                      >
                        View All
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : !hasActiveSessions ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Icon name="PlusCircle" size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                <p className="text-gray-500 mb-6">Start your first poker session to begin tracking your performance.</p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      
      <PlayerCardModal open={playerCardOpen} onOpenChange={setPlayerCardOpen} />
      <ViewAllNotesModal open={notesModalOpen} onOpenChange={setNotesModalOpen} />
    </div>
  );
}
