
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import FilterBar from '@/components/ui/FilterBar';
import SessionCard from '@/components/SessionCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import StorageWarningAlert from '@/components/StorageWarningAlert';

export default function SessionHistory() {
  const navigate = useNavigate();
  const { sessions, filters } = useSessionContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseSessions, setSupabaseSessions] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchSupabaseSessions = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setSupabaseSessions(data);
        }
      } catch (error) {
        console.error('Error fetching sessions from Supabase:', error);
        toast({
          title: "Failed to load sessions",
          description: "There was a problem loading your sessions from the server.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSupabaseSessions();
  }, [user, toast]);
  
  // Filter sessions based on selected filters
  const filteredSessions = sessions.filter(session => {
    // Filter by game type
    if (filters.gameType && filters.gameType !== 'All' && session.gameType !== filters.gameType) {
      return false;
    }
    
    // Filter by format
    if (filters.format && filters.format !== 'All' && session.format !== filters.format) {
      return false;
    }
    
    // Filter by location
    if (filters.location && !session.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Sort sessions by start time (newest first)
  const sortedSessions = [...filteredSessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <button onClick={() => navigate(-1)} className="text-poker-feltGreen mb-4 flex items-center">
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Session History</h1>
            <StorageWarningAlert />
          </div>
        </header>
        
        <FilterBar />
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : sortedSessions.length > 0 ? (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Local Sessions</h2>
              {sortedSessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
            
            {user && supabaseSessions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Cloud Sessions</h2>
                {supabaseSessions.map(session => (
                  <div key={session.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">Cloud Session</h3>
                        <p className="text-gray-500 text-sm">
                          {new Date(session.start_time).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/cloud-session/${session.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
            No sessions found. Adjust your filters or start a new session.
          </div>
        )}
      </div>
    </div>
  );
}
