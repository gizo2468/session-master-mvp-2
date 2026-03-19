
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useNavigateWithRefresh } from '@/hooks/useNavigateWithRefresh';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import SessionCard from '@/components/SessionCard';
import { Button } from '@/components/ui/button';
import FilterBar from '@/components/ui/FilterBar';
import Icon from '@/components/ui/Lucide';
import { useAuth } from '@/context/AuthContext';

export default function SessionHistory() {
  const navigate = useNavigate();
  const { navigateToHomeWithRefresh, isRefreshing } = useNavigateWithRefresh();
  const { user } = useAuth();
  const { sessions, filters, setFilters, isLoading } = useSessionContext();
  const swipeBackRef = useSwipeBack({ fallbackPath: '/', screenName: 'SessionHistory' });
  const [sortBy, setSortBy] = useState<'date' | 'profit'>('date');

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  // Filter sessions
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

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    } else {
      const profitA = (a.cashOut || 0) - a.buyIn;
      const profitB = (b.cashOut || 0) - b.buyIn;
      return profitB - profitA;
    }
  });

  const completedSessions = sortedSessions.filter(s => !s.isActive);

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

  return (
    <div ref={swipeBackRef} className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-md">
          <div className="flex justify-between items-center">
            <Button 
              onClick={navigateToHomeWithRefresh}
              variant="ghost"
              className="text-poker-feltGreen p-0"
              disabled={isRefreshing}
            >
              <Icon name={isRefreshing ? "Loader2" : "ArrowLeft"} size={16} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Home</span>
            </Button>
            <h1 className="text-xl font-bold">Session History</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-6">
        <div className="space-y-4">
          <FilterBar filters={filters} onFiltersChange={setFilters} />
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {completedSessions.length} session{completedSessions.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setSortBy('date')}
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                className={sortBy === 'date' ? 'bg-poker-feltGreen' : ''}
              >
                Date
              </Button>
              <Button
                onClick={() => setSortBy('profit')}
                variant={sortBy === 'profit' ? 'default' : 'outline'}
                size="sm"
                className={sortBy === 'profit' ? 'bg-poker-feltGreen' : ''}
              >
                Profit
              </Button>
            </div>
          </div>

          {completedSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Icon name="FileText" size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-500 mb-6">
                {sessions.length === 0 
                  ? "You haven't completed any poker sessions yet."
                  : "No sessions match your current filters."
                }
              </p>
              <Button 
                onClick={() => navigate('/new-session')}
                className="bg-poker-gold hover:bg-poker-darkGold text-white"
              >
                Start New Session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {completedSessions.map((session) => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  onClick={() => handleSessionClick(session.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
