
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface SessionStats {
  totalSessions: number;
  totalHours: number;
  lastSessionDate: string | null;
  averageSessionLength: number;
  mostPlayedGameType: string | null;
}

export const StudentSessionStats = ({ studentId }: { studentId: string }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessionStats();
  }, [studentId]);

  const loadSessionStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading session stats for student:', studentId);
      console.log('📊 Current coach user:', user?.id);
      
      // Verify we have the necessary data
      if (!studentId || !user?.id) {
        console.error('❌ Missing required data for stats:', { studentId, userId: user?.id });
        setError('Missing required data');
        return;
      }

      // Verify the coach-student relationship
      const { data: connection, error: connectionError } = await supabase
        .from('coach_student_connections')
        .select('id')
        .eq('coach_id', user.id)
        .eq('student_id', studentId)
        .eq('approved', true)
        .single();

      if (connectionError || !connection) {
        console.error('❌ No valid coach-student connection found for stats:', connectionError);
        setError('No valid coaching relationship found');
        return;
      }

      console.log('✅ Valid coach-student connection verified for stats:', connection);
      
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', studentId);

      if (error) {
        console.error('❌ Error loading session stats:', error);
        setError('Failed to load session statistics');
        return;
      }

      console.log('📊 Raw sessions data for stats:', sessions);

      if (!sessions || sessions.length === 0) {
        console.log('ℹ️ No sessions found for stats calculation');
        setStats({
          totalSessions: 0,
          totalHours: 0,
          lastSessionDate: null,
          averageSessionLength: 0,
          mostPlayedGameType: null
        });
        return;
      }

      // Calculate statistics
      const totalSessions = sessions.length;
      
      const totalMinutes = sessions.reduce((sum, session) => {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
        return sum + duration;
      }, 0);
      
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
      const averageSessionLength = Math.round(totalMinutes / totalSessions);
      
      const lastSession = sessions.sort((a, b) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      )[0];
      
      // Find most played game type
      const gameTypeCounts = sessions.reduce((acc, session) => {
        const gameType = session.game_type || 'Unknown';
        acc[gameType] = (acc[gameType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostPlayedGameType = Object.keys(gameTypeCounts).length > 0 
        ? Object.entries(gameTypeCounts).sort(([,a], [,b]) => b - a)[0][0]
        : null;

      const calculatedStats = {
        totalSessions,
        totalHours,
        lastSessionDate: lastSession ? lastSession.start_time : null,
        averageSessionLength,
        mostPlayedGameType
      };

      console.log('📊 Calculated stats:', calculatedStats);
      setStats(calculatedStats);
      
    } catch (error) {
      console.error('❌ Error in loadSessionStats:', error);
      setError('Failed to calculate session statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <Icon name="Loader" className="mx-auto mb-2 h-6 w-6 animate-spin" />
            <p className="text-sm">Loading stats...</p>
            <p className="text-xs mt-1">Calculating real session statistics...</p>
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
            <Icon name="AlertCircle" className="mx-auto mb-2 h-6 w-6" />
            <p className="text-sm">{error}</p>
            <div className="text-xs mt-2 p-2 bg-red-50 rounded">
              <p>Debug Info:</p>
              <p>Student ID: {studentId}</p>
              <p>Coach ID: {user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="BarChart3" size={18} />
          <span>Session Overview</span>
          <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
            Real Data
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-poker-feltGreen">{stats.totalSessions}</div>
            <div className="text-xs text-gray-500">Total Sessions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-poker-feltGreen">{stats.totalHours}h</div>
            <div className="text-xs text-gray-500">Total Hours</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-poker-feltGreen">{stats.averageSessionLength}m</div>
            <div className="text-xs text-gray-500">Avg Length</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-poker-feltGreen">
              {stats.mostPlayedGameType || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Most Played</div>
          </div>
        </div>
        
        {stats.lastSessionDate && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Icon name="Clock" size={14} />
              <span>Last session: {new Date(stats.lastSessionDate).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {/* Debug info for development */}
        <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded">
          <p>✅ Real statistics calculated from {stats.totalSessions} sessions</p>
          <p>Student ID: {studentId}</p>
          <p>Coach ID: {user?.id}</p>
        </div>
      </CardContent>
    </Card>
  );
};
