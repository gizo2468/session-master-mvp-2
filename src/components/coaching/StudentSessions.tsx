
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';

interface Session {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  game_type?: string;
  session_type?: string;
  notes?: string;
  created_at: string;
}

export const StudentSessions = ({ studentId }: { studentId: string }) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadStudentSessions();
  }, [studentId]);

  const loadStudentSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading sessions for student:', studentId);
      
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', studentId)
        .order('start_time', { ascending: false })
        .limit(10);

      if (sessionsError) {
        console.error('❌ Error loading student sessions:', sessionsError);
        setError('Failed to load sessions');
        return;
      }

      console.log(`📋 Loaded ${sessionsData?.length || 0} sessions for student ${studentId}:`);
      console.table(sessionsData);
      
      setSessions(sessionsData || []);
    } catch (error) {
      console.error('❌ Error in loadStudentSessions:', error);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    return diffInMinutes;
  };

  const formatGameType = (gameType?: string, sessionType?: string) => {
    const type = gameType || 'Unknown';
    const format = sessionType || 'Session';
    return `${type} ${format}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500 dark:text-muted-foreground">
            <Icon name="Loader" className="mx-auto mb-2 h-8 w-8 animate-spin" />
            <p>Loading sessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">
            <Icon name="AlertCircle" className="mx-auto mb-2 h-8 w-8" />
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={loadStudentSessions}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500 dark:text-muted-foreground">
            <Icon name="Clock" className="mx-auto mb-2 h-8 w-8" />
            <p>This student hasn't recorded any sessions yet.</p>
            <p className="text-sm mt-1">Sessions will appear here once the student starts tracking their poker sessions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {sessions.map(session => {
        const duration = calculateDuration(session.start_time, session.end_time);
        const gameTypeDisplay = formatGameType(session.game_type, session.session_type);
        
        return (
          <Card key={session.id}>
            <CardContent className="p-4">
              <div className="flex flex-col h-full">
                {/* Session info section */}
                <div className="mb-3">
                  <div className="font-medium flex items-center gap-2">
                    {gameTypeDisplay}
                    {/* Add badge for recent sessions */}
                    {new Date(session.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        Recent
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">
                    {duration} minutes • {new Date(session.start_time).toLocaleDateString()}
                  </div>
                  {session.notes && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                      {session.notes}
                    </div>
                  )}
                </div>
                
                {/* Action button section */}
                <div className="flex justify-between items-center mt-auto pt-2">
                  <div className="text-sm text-gray-500 dark:text-muted-foreground">
                    Session {session.id.slice(0, 8)}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/coach/student/${studentId}/session/${session.id}`)}
                    className="flex items-center gap-1 min-w-[90px] justify-center"
                  >
                    <Icon name="MessageSquare" size={14} />
                    <span>Review</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {sessions.length > 0 && (
        <div className="text-center pt-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // This could navigate to a full sessions list page in the future
              console.log('Show all sessions for student:', studentId);
            }}
          >
            View All Sessions
          </Button>
        </div>
      )}
    </div>
  );
};
