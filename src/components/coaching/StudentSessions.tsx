
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';

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
  
  // Set up real-time subscriptions for session updates
  useRealtimeSubscriptions([
    {
      table: 'sessions',
      event: '*',
      filter: `user_id=eq.${studentId}`,
      callback: (payload) => {
        console.log('🔔 Session change detected for student:', payload);
        loadStudentSessions();
      }
    }
  ], [studentId, user?.id]);

  useEffect(() => {
    loadStudentSessions();
  }, [studentId, user?.id]);

  const loadStudentSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading sessions for student:', studentId);
      
      if (!studentId || !user?.id) {
        console.error('❌ Missing required data:', { studentId, userId: user?.id });
        setError('Missing required data');
        return;
      }

      // Verify the coach-student relationship first
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

      // Load student's sessions from Supabase (live data only)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', studentId)
        .order('start_time', { ascending: false });

      if (sessionsError) {
        console.error('❌ Error loading student sessions:', sessionsError);
        setError('Failed to load sessions');
        return;
      }

      console.log(`📋 Loaded ${sessionsData?.length || 0} sessions for student ${studentId}`);
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
            <p className="text-xs mt-1">Fetching latest session data from cloud...</p>
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
            <div className="text-xs mt-1 space-y-1">
              <div>Student ID: {studentId.slice(0, 8)}...</div>
              <div>Coach ID: {user?.id?.slice(0, 8) || 'N/A'}...</div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={loadStudentSessions}
            >
              <Icon name="RefreshCw" className="mr-1 h-3 w-3" />
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
                <div className="mb-3">
                  <div className="font-medium flex items-center gap-2">
                    {gameTypeDisplay}
                    {new Date(session.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        Recent
                      </Badge>
                    )}
                    <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      <Icon name="Database" size={10} className="mr-1" />
                      Live Data
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
              console.log('Future: Navigate to full sessions list for student:', studentId);
            }}
          >
            View All Sessions ({sessions.length} total)
          </Button>
        </div>
      )}
    </div>
  );
};
