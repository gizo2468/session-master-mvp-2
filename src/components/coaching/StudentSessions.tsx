
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadStudentSessions();
    
    // Set up real-time subscription for new sessions
    const channel = supabase
      .channel(`student-${studentId}-sessions`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sessions',
          filter: `user_id=eq.${studentId}`
        },
        (payload) => {
          console.log('🔔 New session detected for student:', payload);
          loadStudentSessions(); // Reload sessions when new ones are added
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const loadStudentSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading sessions for student:', studentId);
      console.log('🔍 Current coach user:', user?.id);
      
      // Verify we have the necessary data
      if (!studentId || !user?.id) {
        console.error('❌ Missing required data:', { studentId, userId: user?.id });
        setError('Missing required data');
        return;
      }

      // First verify the coach-student relationship
      const { data: connection, error: connectionError } = await supabase
        .from('coach_student_connections')
        .select('id')
        .eq('coach_id', user.id)
        .eq('student_id', studentId)
        .eq('approved', true)
        .single();

      if (connectionError || !connection) {
        console.error('❌ No valid coach-student connection found:', connectionError);
        setError('No valid coaching relationship found');
        return;
      }

      console.log('✅ Valid coach-student connection verified:', connection);

      // Now fetch the student's sessions
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
      
      // Validate that we're getting real session data
      if (sessionsData && sessionsData.length > 0) {
        console.log('✅ Real session data loaded successfully');
        sessionsData.forEach((session, index) => {
          console.log(`Session ${index + 1}:`, {
            id: session.id,
            userId: session.user_id,
            startTime: session.start_time,
            gameType: session.game_type,
            sessionType: session.session_type
          });
        });
      } else {
        console.log('ℹ️ No sessions found for this student');
      }
      
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
          <div className="text-center text-gray-500">
            <Icon name="Loader" className="mx-auto mb-2 h-8 w-8 animate-spin" />
            <p>Loading sessions...</p>
            <p className="text-xs mt-1">Fetching real session data from database...</p>
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
            <p className="text-xs mt-1">Student ID: {studentId}</p>
            <p className="text-xs">Coach ID: {user?.id}</p>
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
          <div className="text-center text-gray-500">
            <Icon name="Clock" className="mx-auto mb-2 h-8 w-8" />
            <p>This student hasn't recorded any sessions yet.</p>
            <p className="text-sm mt-1">Sessions will appear here once the student starts tracking their poker sessions.</p>
            <div className="text-xs mt-2 p-2 bg-gray-100 rounded">
              <p>Debug Info:</p>
              <p>Student ID: {studentId}</p>
              <p>Coach ID: {user?.id}</p>
              <p>Sessions found: {sessions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Debug info for development */}
      <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
        <p>✅ Real session data loaded: {sessions.length} sessions</p>
        <p>Student ID: {studentId}</p>
        <p>Coach ID: {user?.id}</p>
      </div>
      
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
                    <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      Real Data
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {duration} minutes • {new Date(session.start_time).toLocaleDateString()}
                  </div>
                  {session.notes && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {session.notes}
                    </div>
                  )}
                </div>
                
                {/* Action button section */}
                <div className="flex justify-between items-center mt-auto pt-2">
                  <div className="text-sm text-gray-500">
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
            View All Sessions ({sessions.length} total)
          </Button>
        </div>
      )}
    </div>
  );
};
