
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSessionContext } from '@/context/SessionContext';
import { useActiveSessionRecovery } from '@/hooks/useActiveSessionRecovery';
import SessionCard from '@/components/SessionCard';
import NewSessionButton from '@/components/NewSessionButton';
import StatsQuickView from '@/components/StatsQuickView';
import StorageWarningAlert from '@/components/StorageWarningAlert';

import FocusModeButton from '@/components/FocusModeButton';
import ActiveSessionsList from '@/components/ActiveSessionsList';
import Logo from '@/components/Logo';
import Icon from '@/components/ui/Lucide';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import FilterBar from '@/components/ui/FilterBar';
import { SessionFilter } from '@/types/poker';

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  
  const [showPastSessionForm, setShowPastSessionForm] = useState(false);
  

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
            <div className="flex-1">
              <Button 
                onClick={() => navigate('/settings')}
                variant="outline" 
                size="sm"
                className="text-poker-feltGreen border-poker-feltGreen hover:bg-poker-feltGreen hover:text-white"
              >
                <Icon name="Settings" size={16} />
              </Button>
            </div>
            <div className="flex-1 flex justify-center">
              <Logo />
            </div>
            <div className="flex-1 flex justify-end">
              <FocusModeButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-6">
        {showStorageWarning && <StorageWarningAlert />}
        
        
        <div className="flex flex-col items-center gap-6">
          {/* NEW SESSION button appears first, at the top */}
          <div className="flex justify-center">
            <NewSessionButton />
          </div>

          {/* Stats section appears after the button */}
          <StatsQuickView />
          
          {/* Active Sessions List - appears after stats if there are active sessions */}
          {hasActiveSessions && (
            <ActiveSessionsList 
              sessions={activeSessions}
              onResume={resumeSession}
            />
          )}
          
          {sessions.length > 0 && (
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-extrabold tracking-tight">Recent Sessions</h2>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setShowPastSessionForm(true)}
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
                    className="text-poker-feltGreen"
                  >
                    View All
                  </Button>
                </div>
              </div>
              
              <FilterBar filters={filters} onFiltersChange={setFilters} />
              
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    onClick={() => handleSessionClick(session.id)}
                    showActions={true}
                  />
                ))}
              </div>
            </div>
          )}

          {sessions.length === 0 && !hasActiveSessions && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Icon name="PlusCircle" size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500 mb-6">Start your first poker session to begin tracking your performance.</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Add Past Session Form Dialog */}
      <Dialog open={showPastSessionForm} onOpenChange={setShowPastSessionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Add Past Session</h2>
            <p className="text-gray-600 mb-6">This feature will be available soon.</p>
            <Button onClick={() => setShowPastSessionForm(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
